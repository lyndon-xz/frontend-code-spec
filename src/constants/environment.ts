export enum Environment {
  Development = 'development',
  Production = 'production',
}

/** 构建期注入的环境标识键：Vite 的 define、webpack 的 DefinePlugin 都会把它替换成字面量 */
export const APP_ENV_KEY = 'APP_ENV';

/** 指向本机的域名，仅在未注入构建期标识时作兜底判断 */
export const LOCAL_HOSTNAMES = ['localhost', '0.0.0.0', '::1', '[::1]'];

/** 回环网段前缀：127.0.0.0/8 整段都是本机，不止 127.0.0.1 */
export const LOOPBACK_HOSTNAME_PREFIX = '127.';

/** mDNS 与局域网自签域名后缀，如 my-mac.local */
export const LOCAL_HOSTNAME_SUFFIX = '.local';
