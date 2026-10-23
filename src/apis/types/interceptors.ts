import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** onRejected 必须继续 reject 或抛出，否则错误在此被吞 */
export interface ReqInterceptor {
  onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected?: (error: unknown) => Promise<unknown>;
}

/** onRejected 必须继续 reject 或抛出，否则错误在此被吞 */
export interface ResInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: unknown) => Promise<unknown>;
}
