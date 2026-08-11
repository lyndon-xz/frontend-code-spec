import axios, { type AxiosInstance, type AxiosRequestConfig, type Method } from 'axios';

import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { analyticsReqInterceptor, analyticsResInterceptor } from './interceptors/analytics';
import { authReqInterceptor } from './interceptors/auth';
import { businessErrorInterceptor } from './interceptors/error/business';
import { networkErrorInterceptor } from './interceptors/error/network';
import { ssoInterceptor } from './interceptors/sso';
import type { EnhancedRequestConfig, InstanceConfig } from './types/config';
import { generateBaseUrl } from './utils/base-url';
import { registerDedupe } from './utils/dedupe';
import { canRetry, delay, getRetryDelay } from './utils/retry';
import { generateRequestId } from './utils/trace';

/** 实例级可覆盖配置（同一 serviceCode 首次创建生效，后续差异会在开发环境告警） */
export type RequestInstanceOptions = Pick<
  AxiosRequestConfig,
  'timeout' | 'withCredentials' | 'headers'
>;

const DEFAULT_TIMEOUT = 3000;
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

// 同一 serviceCode 在运行期只创建一个实例；两张表按 serviceCode 对齐，签名用于配置漂移告警
const serviceInstances = new Map<string, AxiosInstance>();
const serviceSignatures = new Map<string, string>();

const warnOnConfigDrift = (serviceCode: string, signature: string) => {
  if (getEnvironment() !== Environment.Development) return;
  if (serviceSignatures.get(serviceCode) === signature) return;

  console.warn(
    `[request] serviceCode "${serviceCode}" 已用首次配置创建实例，本次不同的实例级配置将被忽略`,
  );
};

const getServiceInstance = (config: InstanceConfig): AxiosInstance => {
  const {
    serviceCode,
    timeout = DEFAULT_TIMEOUT,
    withCredentials = true,
    headers,
    reqInterceptors,
    resInterceptors,
    ...restConfig
  } = config;

  // 浅合并而非整体替换：调用方只想加一个 header 时，不该连默认 Content-Type 一起丢掉
  const mergedHeaders = { ...DEFAULT_HEADERS, ...headers };

  const signature = JSON.stringify({
    timeout,
    withCredentials,
    headers: mergedHeaders,
    restConfig,
  });

  const existing = serviceInstances.get(serviceCode);

  if (existing) {
    warnOnConfigDrift(serviceCode, signature);
    return existing;
  }

  const instance = axios.create({
    ...restConfig,
    headers: mergedHeaders,
    timeout,
    withCredentials,
    baseURL: generateBaseUrl(serviceCode),
  });

  reqInterceptors.forEach((interceptor) => {
    instance.interceptors.request.use(interceptor.onFulfilled, interceptor.onRejected);
  });

  resInterceptors.forEach((interceptor) => {
    instance.interceptors.response.use(interceptor.onFulfilled, interceptor.onRejected);
  });

  serviceInstances.set(serviceCode, instance);
  serviceSignatures.set(serviceCode, signature);
  return instance;
};

interface RetryContext {
  instance: AxiosInstance;
  config: EnhancedRequestConfig;
  method: Method;
  signal?: EnhancedRequestConfig['signal'];
  maxRetries: number;
}

const sendWithRetry = async <T>(context: RetryContext): Promise<T> => {
  const { instance, config, method, signal, maxRetries } = context;
  // 在循环外生成：每次尝试都是新的 config 对象，交给拦截器生成会让同一请求的重试拿到互不关联的 id
  const requestId = generateRequestId({ ...config, method });

  for (let attempt = 0; ; attempt += 1) {
    const requestConfig = {
      ...config,
      method,
      signal,
      __requestId: requestId,
      __retriesLeft: maxRetries - attempt,
    };

    try {
      const response = await instance.request<T>(requestConfig);
      return response.data;
    } catch (error) {
      if (attempt >= maxRetries || !canRetry(error, method, config.retry)) throw error;
      await delay(getRetryDelay(attempt + 1, config.retry), signal);
    }
  }
};

/*
 * 响应拦截器按注册顺序 FIFO 执行：network（异常归一）→ sso（登录态）→ business（业务码、拆包）→ analytics（上报）。
 * 异常兜底（转 null / 重试）由下方 createRequest 统一处理，不放进拦截器链。
 */
const buildInstance = (serviceCode: string, options: RequestInstanceOptions = {}): AxiosInstance =>
  getServiceInstance({
    serviceCode,
    ...options,
    reqInterceptors: [analyticsReqInterceptor, authReqInterceptor],
    resInterceptors: [
      networkErrorInterceptor,
      ssoInterceptor,
      businessErrorInterceptor,
      analyticsResInterceptor,
    ],
  });

/**
 * 创建指定 HTTP 方法的请求函数：自动剥离业务信封只返回 data，
 * 默认吞掉错误以 null 返回（可用 isErrorSwallowed: false 改为抛出 RequestError）。
 */
export const createRequest = (
  serviceCode: string,
  method: Method,
  options?: RequestInstanceOptions,
) => {
  const instance = buildInstance(serviceCode, options);

  return async <T = unknown>(config: EnhancedRequestConfig): Promise<T | null> => {
    const { url, params, data, retry, isDeduped, signal: userSignal, isErrorSwallowed } = config;
    const maxRetries = retry?.count ?? 0;
    // 调用方自带 signal 时不接管取消控制，避免覆盖它
    const dedupe =
      isDeduped && userSignal == null
        ? registerDedupe({ serviceCode, method, url, params, data })
        : undefined;
    const signal = userSignal ?? dedupe?.signal;

    try {
      return await sendWithRetry<T>({ instance, config, method, signal, maxRetries });
    } catch (error) {
      if (isErrorSwallowed !== false) return null;
      throw error;
    } finally {
      dedupe?.release();
    }
  };
};

export const createGetRequest = (serviceCode: string, options?: RequestInstanceOptions) =>
  createRequest(serviceCode, 'GET', options);
export const createPostRequest = (serviceCode: string, options?: RequestInstanceOptions) =>
  createRequest(serviceCode, 'POST', options);
export const createPutRequest = (serviceCode: string, options?: RequestInstanceOptions) =>
  createRequest(serviceCode, 'PUT', options);
export const createDeleteRequest = (serviceCode: string, options?: RequestInstanceOptions) =>
  createRequest(serviceCode, 'DELETE', options);
