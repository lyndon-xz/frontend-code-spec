import axios, { AxiosHeaders, type AxiosInstance } from 'axios';

import { capabilityCacheKey, requestInterceptors, responseInterceptors } from './capability';
import type { RequestCapability, RequestInstanceOptions } from './types/request/options';
import { generateBaseUrl } from './utils/base-url';

const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };

// AxiosHeaders 带字符串索引，展开会把方法一并抄进来。先取出自己的键再合并
const headerRecord = (headers: RequestInstanceOptions['headers']): Record<string, unknown> => {
  if (headers == null) {
    return {};
  }
  if (headers instanceof AxiosHeaders) {
    return headers.toJSON();
  }

  return Object.fromEntries(Object.entries(headers));
};

const serviceInstances = new Map<string, AxiosInstance>();

/** 按 serviceCode 与能力组合复用 axios 实例。同一组合里，timeout 等首次创建后不再改 */
export const openInstance = (
  serviceCode: string,
  capabilities: readonly RequestCapability[],
  options: RequestInstanceOptions,
): AxiosInstance => {
  const cacheKey = capabilityCacheKey(serviceCode, capabilities);
  const existing = serviceInstances.get(cacheKey);
  if (existing) {
    return existing;
  }

  const { timeout = DEFAULT_TIMEOUT_MS, withCredentials = true, headers } = options;
  const mergedHeaders = { ...DEFAULT_HEADERS, ...headerRecord(headers) };
  const instance = axios.create({
    timeout,
    withCredentials,
    headers: mergedHeaders,
    baseURL: generateBaseUrl(serviceCode),
  });

  for (const interceptor of requestInterceptors(capabilities)) {
    const { onFulfilled, onRejected } = interceptor;

    instance.interceptors.request.use(onFulfilled, onRejected);
  }

  for (const interceptor of responseInterceptors(capabilities)) {
    const { onFulfilled, onRejected } = interceptor;

    instance.interceptors.response.use(onFulfilled, onRejected);
  }

  serviceInstances.set(cacheKey, instance);
  return instance;
};
