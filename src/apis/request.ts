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

/** 实例级可覆盖配置，同一 serviceCode 仅首次创建时生效 */
export type RequestInstanceOptions = Pick<
  AxiosRequestConfig,
  'timeout' | 'withCredentials' | 'headers'
>;

const DEFAULT_TIMEOUT = 3000;
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

const serviceInstances = new Map<string, AxiosInstance>();
const serviceSignatures = new Map<string, string>();

const warnOnConfigDrift = (serviceCode: string, signature: string) => {
  if (getEnvironment() !== Environment.Development) {
    return;
  }
  if (serviceSignatures.get(serviceCode) === signature) {
    return;
  }

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
  // 循环外生成，保证重试共用同一个 requestId
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
      if (attempt >= maxRetries || !canRetry(error, method, config.retry)) {
        throw error;
      }
      await delay(getRetryDelay(attempt + 1, config.retry), signal);
    }
  }
};

// 响应拦截器顺序不可调：归一 → 登录态 → 业务码拆包 → 上报
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

/** 剥离业务信封后只返回 data */
export const createRequest = (
  serviceCode: string,
  method: Method,
  options?: RequestInstanceOptions,
) => {
  const instance = buildInstance(serviceCode, options);

  return async <T = unknown>(config: EnhancedRequestConfig): Promise<T | null> => {
    const { url, params, data, retry, isDeduped, signal: userSignal, isErrorSwallowed } = config;
    const maxRetries = retry?.count ?? 0;
    // 调用方自带 signal 时不接管取消控制
    const dedupe =
      isDeduped && userSignal == null
        ? registerDedupe({ serviceCode, method, url, params, data })
        : undefined;
    const signal = userSignal ?? dedupe?.signal;

    try {
      return await sendWithRetry<T>({ instance, config, method, signal, maxRetries });
    } catch (error) {
      if (isErrorSwallowed !== false) {
        return null;
      }
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
