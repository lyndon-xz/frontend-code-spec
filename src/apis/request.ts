import type { AxiosInstance, Method } from 'axios';

import { createCapabilitySet, requestIdFor } from './capability';
import { openInstance } from './instance';
import type { EnhancedRequestConfig } from './types/request/config';
import type { CreateRequestOptions } from './types/request/options';
import { registerDedupe } from './utils/dedupe';
import { isCanceledError } from './utils/error';
import { canRetry, delay, getRetryDelay } from './utils/retry';

interface AttemptContext {
  instance: AxiosInstance;
  config: EnhancedRequestConfig;
  method: Method;
  signal?: EnhancedRequestConfig['signal'];
  maxRetries: number;
  requestId?: string;
}

const sendAttempt = async <T>(context: AttemptContext): Promise<T> => {
  const { instance, config, method, signal, maxRetries, requestId } = context;

  for (let attempt = 0; ; attempt += 1) {
    const requestConfig = {
      ...config,
      method,
      signal,
      ...(requestId == null ? {} : { __requestId: requestId }),
      /*
       * 复制 retry，写入这一次之后还剩几次。count 仍是调用方传入的最多几次。
       * 网络错误拦截器看剩余次数决定先不弹提示。调用方原来的对象不改。
       */
      ...(config.retry == null
        ? {}
        : { retry: { ...config.retry, retriesLeft: maxRetries - attempt } }),
    };

    try {
      const response = await instance.request<T>(requestConfig);

      return response.data;
    } catch (error) {
      const { retry } = config;

      if (attempt >= maxRetries || !canRetry(error, method, retry)) {
        throw error;
      }
      await delay(getRetryDelay(attempt + 1), signal);
    }
  }
};

/** 剥离业务信封后只返回 data */
export const createRequest = (
  serviceCode: string,
  method: Method,
  options: CreateRequestOptions,
) => {
  const { capabilities, timeout, withCredentials, headers } = options;
  const enabled = createCapabilitySet(capabilities);
  const instance = openInstance(serviceCode, capabilities, { timeout, withCredentials, headers });

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
    // 调用方自带 signal 时不接管取消控制；未列入 dedupe 时忽略 isDeduped
    const dedupe =
      enabled.has('dedupe') && isDeduped && userSignal == null
        ? registerDedupe({ serviceCode, method, url, params, data })
        : undefined;
    const signal = userSignal ?? dedupe?.signal;

    try {
      const maxRetries = enabled.has('retry') ? (retry?.count ?? 0) : 0;

      return await sendAttempt<T>({
        instance,
        config,
        method,
        signal,
        maxRetries,
        requestId: requestIdFor(enabled, method, url),
      });
    } catch (error) {
      /*
       * 取消不算失败，一律上抛：被同签名新请求取消时若也返回 null，调用方就分不清
       * 「这次没成功」和「这次已被更新的请求接替」，把它按失败渲染成空态是错的。
       * 未列入 errorSwallow 时，其余错误也上抛。
       */
      if (enabled.has('errorSwallow') && isErrorSwallowed && !isCanceledError(error)) {
        return null;
      }
      throw error;
    } finally {
      dedupe?.release();
    }
  };
};

export const createGetRequest = (serviceCode: string, options: CreateRequestOptions) =>
  createRequest(serviceCode, 'GET', options);
export const createPostRequest = (serviceCode: string, options: CreateRequestOptions) =>
  createRequest(serviceCode, 'POST', options);
export const createPutRequest = (serviceCode: string, options: CreateRequestOptions) =>
  createRequest(serviceCode, 'PUT', options);
export const createDeleteRequest = (serviceCode: string, options: CreateRequestOptions) =>
  createRequest(serviceCode, 'DELETE', options);
