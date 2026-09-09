/**
 * 把同一业务请求的请求端、响应端与多次重试串成一条链路。
 * method 收宽到 string：axios 的 config.method 本就是放宽的字符串，收窄需要断言，而断言在本仓禁用。
 */
export const generateRequestId = (method: string, url = ''): string => {
  const uniqueId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

  return `${method.toUpperCase()}_${url}_${uniqueId}`;
};
