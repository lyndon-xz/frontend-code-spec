import type { AxiosRequestConfig } from 'axios';

/** 可开关的能力。未列入的不注册、不执行，调用方每次自己列，没有默认全开 */
export const REQUEST_CAPABILITIES = [
  'auth',
  'sso',
  'analytics',
  'businessError',
  'networkError',
  'retry',
  'dedupe',
  'errorSwallow',
] as const;

export type RequestCapability = (typeof REQUEST_CAPABILITIES)[number];

/**
 * 传给 axios 实例的三项。字段名沿用 axios，好在创建实例时原样交过去。
 * 放在这个文件里，是因为单次请求会扩充 AxiosRequestConfig，同文件里 Pick 会得到错误类型。
 */
export type RequestInstanceOptions = Pick<
  AxiosRequestConfig,
  'timeout' | 'withCredentials' | 'headers'
>;

/** 创建请求函数的选项：能力名单，加上实例那三项 */
export interface CreateRequestOptions extends RequestInstanceOptions {
  capabilities: readonly RequestCapability[];
}
