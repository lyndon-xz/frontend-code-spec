import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** 请求拦截器 */
export interface ReqInterceptor {
  onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected?: (error: unknown) => Promise<unknown>;
}

/** 响应拦截器 */
export interface ResInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: unknown) => Promise<unknown>;
}
