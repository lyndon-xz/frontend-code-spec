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
import { isCanceledError } from './utils/error';
import { canRetry, delay, getRetryDelay } from './utils/retry';
import { generateRequestId } from './utils/trace';

/** 实例级可覆盖配置，同一 serviceCode 仅首次创建时生效 */
export type RequestInstanceOptions = Pick<
  AxiosRequestConfig,
  'timeout' | 'withCredentials' | 'headers'
>;

const DEFAULT_TIMEOUT_MS = 3000;
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

const resolveServiceInstance = (config: InstanceConfig): AxiosInstance => {
  const {
    serviceCode,
    timeout = DEFAULT_TIMEOUT_MS,
    withCredentials = true,
    headers,
    reqInterceptors,
    resInterceptors,
    ...restConfig
  } = config;

  // eslint-disable-next-line @typescript-eslint/no-misused-spread -- AxiosHeaders 把每个头存成自有可枚举属性，展开不丢键，见 request.test.ts 的 AxiosHeaders 用例
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

  // 显式键顺序与上面的解构、签名对象保持一致，便于三处对照读；...restConfig 必须在前，否则会覆盖显式键
  const instance = axios.create({
    ...restConfig,
    timeout,
    withCredentials,
    headers: mergedHeaders,
    baseURL: generateBaseUrl(serviceCode),
  });

  reqInterceptors.forEach((interceptor) => {
    const { onFulfilled, onRejected } = interceptor;

    instance.interceptors.request.use(onFulfilled, onRejected);
  });

  resInterceptors.forEach((interceptor) => {
    const { onFulfilled, onRejected } = interceptor;

    instance.interceptors.response.use(onFulfilled, onRejected);
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
  const requestId = generateRequestId(method, config.url);

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
      const { retry } = config;

      if (attempt >= maxRetries || !canRetry(error, method, retry)) {
        throw error;
      }
      await delay(getRetryDelay(attempt + 1, retry), signal);
    }
  }
};

// 响应拦截器顺序不可调：归一 → 登录态 → 业务码拆包 → 上报
const resolveInstance = (
  serviceCode: string,
  options: RequestInstanceOptions = {},
): AxiosInstance =>
  resolveServiceInstance({
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
  const instance = resolveInstance(serviceCode, options);

  return async <T = unknown>(config: EnhancedRequestConfig): Promise<T | null> => {
    const {
      url,
      params,
      data,
      retry,
      isDeduped,
      signal: userSignal,
      isErrorSwallowed = true,
    } = config;
    // 调用方自带 signal 时不接管取消控制
    const dedupe =
      isDeduped && userSignal == null
        ? registerDedupe({ serviceCode, method, url, params, data })
        : undefined;
    const signal = userSignal ?? dedupe?.signal;

    try {
      const maxRetries = retry?.count ?? 0;

      return await sendWithRetry<T>({ instance, config, method, signal, maxRetries });
    } catch (error) {
      /*
       * 取消不算失败，一律上抛：被同签名新请求取消时若也返回 null，调用方就分不清
       * 「这次没成功」和「这次已被更新的请求接替」，把它按失败渲染成空态是错的。
       */
      if (isErrorSwallowed && !isCanceledError(error)) {
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
