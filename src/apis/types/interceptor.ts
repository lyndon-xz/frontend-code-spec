import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface ReqInterceptor {
  onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onRejected?: (error: unknown) => Promise<unknown>;
}

export interface ResInterceptor {
  onFulfilled?: (response: AxiosResponse) => AxiosResponse;
  onRejected?: (error: unknown) => Promise<unknown>;
}
