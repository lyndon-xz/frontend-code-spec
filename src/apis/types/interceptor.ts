import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * 请求拦截器。两个回调对应 axios 的成功链与失败链；
 * onRejected 必须继续 reject 或抛出，否则错误在此处就被吞掉，
 * 后续拦截器与调用方都感知不到，请求层的归一、提示、埋点会一并失效。
 */
export interface ReqInterceptor {
  onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected?: (error: unknown) => Promise<unknown>;
}

/** 响应拦截器，onRejected 的约束同 ReqInterceptor */
export interface ResInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: unknown) => Promise<unknown>;
}
