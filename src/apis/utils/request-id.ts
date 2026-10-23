// 经过函数返回之后，类型才保留「可能没有 crypto / randomUUID」。直接写在赋值上会被收窄成必有
const readCryptoApi = (): Partial<Pick<Crypto, 'randomUUID'>> | undefined => globalThis.crypto;

const readRandomUuid = (): string | undefined => readCryptoApi()?.randomUUID?.();

/**
 * 把同一业务请求的请求端、响应端与多次重试串成一条链路。
 * method 收宽到 string：axios 的 config.method 本就是放宽的字符串，收窄需要断言，而断言在本仓禁用。
 */
export const generateRequestId = (method: string, url = ''): string => {
  const uniqueId = readRandomUuid() ?? `${Date.now()}_${Math.random()}`;

  return `${method.toUpperCase()}_${url}_${uniqueId}`;
};
