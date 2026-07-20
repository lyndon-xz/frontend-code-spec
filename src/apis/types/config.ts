import type { AxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from './interceptor';

// 通过模块增强把内部字段 __requestId 挂到 axios 配置上，避免拦截器里用 as 强转写入
declare module 'axios' {
  interface AxiosRequestConfig {
    // 请求唯一标识（内部使用，埋点串联请求与响应）
    __requestId?: string;
    // 请求开始时间戳（内部使用，随 config 生命周期存活，避免用模块级 Map 造成泄漏）
    __requestStartTime?: number;
  }
}

export interface InstanceConfig extends AxiosRequestConfig {
  /** 服务编码，用于生成 baseURL */
  serviceCode: string;
  /** 请求拦截器列表 */
  reqInterceptors: ReqInterceptor[];
  /** 响应拦截器列表 */
  resInterceptors: ResInterceptor[];
}

export interface EnhancedRequestConfig extends AxiosRequestConfig {
  /** 强制要求必传 URL */
  url: string;
  businessError?: {
    /** 静默处理，不显示错误提示 */
    isSilent?: boolean;
    /** 自定义错误提示，不设置则使用服务端返回的 message */
    customMessage?: string;
  };
  networkError?: {
    isSilent?: boolean;
  };
  /** 包装器配置，true 时错误返回 null，false 时抛出异常 */
  isWrapper?: boolean;
}

export interface AxiosLikeError {
  config?: EnhancedRequestConfig;
  message?: string;
  response?: unknown;
}
