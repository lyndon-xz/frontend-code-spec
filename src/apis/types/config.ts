import type { AxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from './interceptor';

/** 业务码错误（code !== 0）的提示策略 */
export interface BusinessErrorOptions {
  /** 静默处理，不弹出错误提示 */
  isSilent?: boolean;
  /** 自定义错误提示，不设置则使用服务端返回的 message */
  customMessage?: string;
}

/** 网络错误的提示策略 */
export interface NetworkErrorOptions {
  /** 静默处理，不弹出错误提示 */
  isSilent?: boolean;
}

/** 自动重试策略，仅对网络错误、超时、5xx 等可恢复错误生效 */
export interface RetryOptions {
  /** 最大重试次数（不含首次请求） */
  count: number;
  /** 重试基础间隔（毫秒），默认 300 */
  delay?: number;
  /** 是否指数退避（第 n 次重试等待 delay * 2^(n-1)），默认 true */
  isBackoff?: boolean;
}

/*
 * 通过模块增强把请求扩展字段挂到 axios 配置上，好处有二：
 * 1. 内部字段（__ 前缀）随 config 生命周期存活，用于埋点串联与重试计数，避免模块级 Map 造成泄漏；
 * 2. 业务字段（businessError 等）让各拦截器直接从 config / error.config 读取，无需再做类型断言。
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    // 请求唯一标识：埋点串联请求与响应
    __requestId?: string;
    __requestStartTime?: number;
    // 剩余可重试次数：供拦截器判断是否抑制错误提示
    __retriesLeft?: number;
    businessError?: BusinessErrorOptions;
    networkError?: NetworkErrorOptions;
    // 不设置则不重试
    retry?: RetryOptions;
    /*
     * 是否对相同请求去重：开启后，同一请求（method + url + 参数）再次发起时，
     * 会取消上一次仍在飞行中的请求，避免竞态导致旧响应覆盖新结果。默认关闭。
     */
    isDeduped?: boolean;
    /*
     * 是否启用异常兜底。
     * true（默认）：任何错误都被吞掉，请求以 null 返回；
     * false：错误以 RequestError 原样抛出，由调用方自行 try/catch 获取错误类型与信息。
     */
    isErrorSwallowed?: boolean;
  }
}

/** 单个请求配置：仅强制 url 必传，其余字段复用 axios 配置与上面的增强字段 */
export interface EnhancedRequestConfig extends AxiosRequestConfig {
  url: string;
}

export interface InstanceConfig extends AxiosRequestConfig {
  /** 服务编码，用于生成 baseURL */
  serviceCode: string;
  reqInterceptors: ReqInterceptor[];
  resInterceptors: ResInterceptor[];
}
