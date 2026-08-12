import type { AxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from './interceptor';

export interface BusinessErrorOptions {
  isSilent?: boolean;
  customMessage?: string;
}

export interface NetworkErrorOptions {
  isSilent?: boolean;
  customMessage?: string;
}

/** 自动重试策略，仅对网络错误、超时、5xx 生效 */
export interface RetryOptions {
  count: number;
  delayMs?: number;
  isBackoff?: boolean;
  /** POST 超时可能已处理，须显式置 true 才重试 */
  isIdempotent?: boolean;
}

// 内部字段（__ 前缀）随 config 生命周期存活，免去模块级 Map 泄漏
declare module 'axios' {
  interface AxiosRequestConfig {
    __requestId?: string;
    __requestStartTimeMs?: number;
    __retriesLeft?: number;
    businessError?: BusinessErrorOptions;
    networkError?: NetworkErrorOptions;
    retry?: RetryOptions;
    isDeduped?: boolean;
    isErrorSwallowed?: boolean;
  }
}

export interface EnhancedRequestConfig extends AxiosRequestConfig {
  url: string;
}

export interface InstanceConfig extends AxiosRequestConfig {
  /** 用于生成 baseURL */
  serviceCode: string;
  reqInterceptors: ReqInterceptor[];
  resInterceptors: ResInterceptor[];
}
