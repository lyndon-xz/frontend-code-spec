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
  /** 最大重试次数，不含首次请求 */
  count: number;
  delayMs?: number;
  /** 指数退避时第 n 次重试等待 delayMs * 2^(n-1) */
  isBackoff?: boolean;
  /** POST / PATCH 超时可能服务端已处理，重试等于重复提交，须显式置 true 才重试 */
  isIdempotent?: boolean;
}

// 内部字段（__ 前缀）随 config 生命周期存活，免去模块级 Map 造成泄漏
declare module 'axios' {
  interface AxiosRequestConfig {
    __requestId?: string;
    __requestStartTimeMs?: number;
    // 剩余可重试次数，供拦截器抑制重试期间的错误提示
    __retriesLeft?: number;
    businessError?: BusinessErrorOptions;
    networkError?: NetworkErrorOptions;
    retry?: RetryOptions;
    // 同一请求（method + url + 参数）再次发起时取消上一次，避免旧响应覆盖新结果
    isDeduped?: boolean;
    // 被去重取消的请求也返回 null，调用方无法区分取消与失败；置 false 改为抛出 RequestError
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
