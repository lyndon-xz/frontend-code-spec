import type { AxiosRequestConfig } from 'axios';

/** 把同一业务请求的请求端、响应端与多次重试串成一条链路 */
export const generateRequestId = (config: AxiosRequestConfig): string => {
  const uniqueId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${config.method?.toUpperCase()}_${config.url}_${uniqueId}`;
};
