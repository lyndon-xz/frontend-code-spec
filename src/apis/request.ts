import type { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import axios from 'axios';

import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { analyticsReqInterceptor, analyticsResInterceptor } from './interceptors/analytics';
import { authReqInterceptor } from './interceptors/auth';
import { businessErrorInterceptor } from './interceptors/error/business';
import { networkErrorInterceptor } from './interceptors/error/network';
import { ssoInterceptor } from './interceptors/sso';
import type { EnhancedRequestConfig, InstanceConfig } from './types/config';
import { generateBaseUrl } from './utils/base-url';
import { registerDedupe, releaseDedupe } from './utils/dedupe';
import { isRetryableError } from './utils/error';
import { delay, getRetryDelay } from './utils/retry';

/** 实例级可覆盖配置（同一 serviceCode 首次创建生效，后续差异会在开发环境告警） */
export type RequestInstanceOptions = Pick<
  AxiosRequestConfig,
  'timeout' | 'withCredentials' | 'headers'
>;

class RequestInstance {
  private static instances = new Map<string, AxiosInstance>();
  private static signatures = new Map<string, string>();

  public static getInstance(config: InstanceConfig): AxiosInstance {
    const {
      serviceCode,
      timeout = 3000,
      withCredentials = true,
      headers = {
        'Content-Type': 'application/json',
      },
      reqInterceptors,
      resInterceptors,
      ...restConfig
    } = config;

    // headers 参与签名：同 serviceCode 下 Content-Type 等差异也应触发漂移告警
    const signature = JSON.stringify({ timeout, withCredentials, headers, restConfig });

    // 同一 serviceCode 在运行期只创建一个实例，首次传入的配置即为该服务的固定配置
    if (this.instances.has(serviceCode)) {
      this.warnOnConfigDrift(serviceCode, signature);
      return this.instances.get(serviceCode)!;
    }

    const instance = axios.create({
      ...restConfig,
      headers,
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

    this.instances.set(serviceCode, instance);
    this.signatures.set(serviceCode, signature);
    return instance;
  }

  // 开发环境下，同一 serviceCode 用不同实例级配置再次创建时告警：后续配置会被静默忽略
  private static warnOnConfigDrift(serviceCode: string, signature: string) {
    if (getEnvironment() !== Environment.Development) return;
    if (this.signatures.get(serviceCode) === signature) return;

    console.warn(
      `[request] serviceCode "${serviceCode}" 已用首次配置创建实例，本次不同的实例级配置将被忽略`,
    );
  }
}

interface RetryContext {
  instance: AxiosInstance;
  config: EnhancedRequestConfig;
  method: Method;
  signal?: EnhancedRequestConfig['signal'];
  maxRetries: number;
}

// 执行请求并按可重试错误自动重试，返回拆包后的数据；最终失败时抛出 RequestError
const sendWithRetry = async <T>(context: RetryContext): Promise<T> => {
  const { instance, config, method, signal, maxRetries } = context;

  for (let attempt = 0; ; attempt += 1) {
    const requestConfig = { ...config, method, signal, __retriesLeft: maxRetries - attempt };

    try {
      const response = await instance.request<T>(requestConfig);
      return response.data;
    } catch (error) {
      if (attempt >= maxRetries || !isRetryableError(error)) throw error;
      if (config.retry) await delay(getRetryDelay(config.retry, attempt + 1));
    }
  }
};

/*
 * 拦截器执行顺序：
 * - 请求阶段：analytics（记录开始时间、requestId）、auth（注入 token）
 * - 响应阶段按注册顺序 FIFO 执行：network（网络/HTTP 异常归一）→ sso（登录态）→ business（业务码、拆包）→ analytics（埋点上报）
 * 异常兜底（转 null / 重试）在下方 createRequest 中统一处理，不再作为拦截器。
 */
const buildInstance = (serviceCode: string, options: RequestInstanceOptions = {}): AxiosInstance =>
  RequestInstance.getInstance({
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
 * 创建指定 HTTP 方法的请求函数。
 *
 * 功能特性：
 * - 无异常处理：默认成功返回数据、失败返回 null（可通过 isErrorSwallowed:false 改为抛出 RequestError）
 * - 响应拆包：自动剥离业务信封，只返回 data
 * - 自动埋点、错误提示（支持静默 / 自定义文案）、SSO 登录跳转
 * - 可选自动重试（retry）与请求去重（isDeduped），并支持传入 AbortSignal 主动取消
 */
export const createRequest = (
  serviceCode: string,
  method: Method,
  options?: RequestInstanceOptions,
) => {
  const instance = buildInstance(serviceCode, options);

  return async <T = unknown>(config: EnhancedRequestConfig): Promise<T | null> => {
    const { retry, isDeduped, signal: userSignal, isErrorSwallowed } = config;
    const maxRetries = retry?.count ?? 0;
    // 仅在开启去重且调用方未自带 signal 时接管取消控制，避免覆盖调用方的 signal
    const controller =
      isDeduped && userSignal == null ? registerDedupe({ ...config, method }) : undefined;
    const signal = userSignal ?? controller?.signal;

    try {
      return await sendWithRetry<T>({ instance, config, method, signal, maxRetries });
    } catch (error) {
      if (isErrorSwallowed !== false) return null;
      throw error;
    } finally {
      if (controller) releaseDedupe({ ...config, method }, controller);
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
