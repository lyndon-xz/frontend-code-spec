import type { AxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from './interceptor';

/** 业务码错误（code !== 0）的提示策略 */
export interface BusinessErrorOptions {
  isSilent?: boolean;
  /** 不设置则使用服务端返回的 message */
  customMessage?: string;
}

/** 网络错误的提示策略 */
export interface NetworkErrorOptions {
  isSilent?: boolean;
  /** 不设置则使用归一后的默认文案 */
  customMessage?: string;
}

/** 自动重试策略，仅对网络错误、超时、5xx 等可恢复错误生效 */
export interface RetryOptions {
  /** 最大重试次数，不含首次请求 */
  count: number;
  delayMs?: number;
  /** 是否指数退避：第 n 次重试等待 delayMs * 2^(n-1) */
  isBackoff?: boolean;
  /**
   * 是否把本请求当作幂等的。不设置时按 HTTP 方法判定：GET / HEAD / OPTIONS / PUT / DELETE 可重试；
   * POST / PATCH 不重试——它们超时最常见的情形是服务端已处理完、只是响应没回来，重试等于重复提交。
   * 接口带幂等键时显式置 true 才重试。
   */
  isIdempotent?: boolean;
}

/*
 * 通过模块增强把扩展字段挂到 axios 配置上：内部字段（__ 前缀）随 config 生命周期存活，
 * 免去模块级 Map 造成泄漏；业务字段让各拦截器直接从 config / error.config 读取，无需类型断言。
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    // 请求唯一标识：埋点串联请求与响应
    __requestId?: string;
    __requestStartTimeMs?: number;
    // 剩余可重试次数：供拦截器判断是否抑制错误提示
    __retriesLeft?: number;
    businessError?: BusinessErrorOptions;
    networkError?: NetworkErrorOptions;
    retry?: RetryOptions;
    // 开启后同一请求（method + url + 参数）再次发起时取消上一次，避免旧响应覆盖新结果
    isDeduped?: boolean;
    /*
     * 默认 true：任何错误都被吞掉，请求以 null 返回。被去重取消的请求同样返回 null，
     * 调用方无法区分「取消」与「失败」，拿 null 去清空列表就会让旧请求的取消覆盖新结果。
     * 置 false 则抛出 RequestError，调用方可按 type === Canceled 区分取消。
     */
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
