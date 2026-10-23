import type { AxiosRequestConfig } from 'axios';

/** 错误提示的共同选项基座，业务错误与网络错误各自从它派生 */
export interface ErrorNoticeOptions {
  isSilent?: boolean;
  customMessage?: string;
}

export type BusinessErrorOptions = ErrorNoticeOptions;

export type NetworkErrorOptions = ErrorNoticeOptions;

/** 自动重试策略，仅对网络错误、超时、5xx 生效。等待时间不在这里配 */
export interface RetryOptions {
  /** 最多重试几次。每次尝试都带着调用方传入的这个数 */
  count: number;
  /** POST 超时可能已处理，须显式置 true 才重试 */
  isIdempotent?: boolean;
  /** 这一次尝试之后还剩几次。调用方不传，请求层写在复制出来的 retry 上 */
  retriesLeft?: number;
}

// 拦截器只能从这份 config 读到请求层写下的 __requestId，重试全程沿用同一个
declare module 'axios' {
  interface AxiosRequestConfig {
    __requestId?: string;
    businessError?: BusinessErrorOptions;
    networkError?: NetworkErrorOptions;
    retry?: RetryOptions;
    isDeduped?: boolean;
    isErrorSwallowed?: boolean;
  }
}

/** params、data 在 axios 里是 any，这里收窄为 unknown，请求层内部取用时不再带出 any */
export interface EnhancedRequestConfig extends AxiosRequestConfig {
  url: string;
  params?: unknown;
  data?: unknown;
}
