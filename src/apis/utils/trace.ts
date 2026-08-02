import type { AxiosRequestConfig } from 'axios';

/**
 * 生成请求唯一标识，把同一业务请求的请求端、响应端与多次重试串成一条链路。
 * 由 request 层在重试循环外生成一次；直接使用 axios 实例（未经 request 层）时由埋点请求拦截器兜底生成。
 */
export const generateRequestId = (config: AxiosRequestConfig): string => {
  const uniqueId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${config.method?.toUpperCase()}_${config.url}_${uniqueId}`;
};
