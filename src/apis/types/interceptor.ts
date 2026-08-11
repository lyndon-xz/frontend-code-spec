import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** onRejected 必须继续 reject 或抛出，否则错误在此被吞掉，归一、提示、埋点一并失效 */
export interface ReqInterceptor {
  onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected?: (error: unknown) => Promise<unknown>;
}

/** onRejected 的约束同 ReqInterceptor */
export interface ResInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: unknown) => Promise<unknown>;
}
