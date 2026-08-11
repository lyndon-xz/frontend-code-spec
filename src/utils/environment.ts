import {
  APP_ENV_KEY,
  Environment,
  LOCAL_HOSTNAME_SUFFIX,
  LOCAL_HOSTNAMES,
  LOOPBACK_HOSTNAME_PREFIX,
} from '@/constants/environment';

/** 环境判定实现，可替换为直接读取构建期注入变量的版本 */
export type EnvironmentProvider = () => Environment;

// 只认已知取值，拼错或注入了别的值时视为未注入并继续兜底
const readInjectedEnvironment = (): Environment | null => {
  const injected = typeof process === 'undefined' ? undefined : process.env[APP_ENV_KEY];

  if (injected === Environment.Development) return Environment.Development;
  if (injected === Environment.Production) return Environment.Production;
  return null;
};

const isLocalHostname = (hostname: string): boolean => {
  if (LOCAL_HOSTNAMES.includes(hostname)) return true;
  if (hostname.startsWith(LOOPBACK_HOSTNAME_PREFIX)) return true;
  return hostname.endsWith(LOCAL_HOSTNAME_SUFFIX);
};

/*
 * 构建期注入的 APP_ENV 是唯一可信来源，浏览器与 SSR 得到一致结论；未注入时靠域名兜底本地调试。
 * 取不到 window（SSR / Node 脚本）按生产处理，避免把调试日志与埋点旁路带到服务端。
 */
const detectEnvironment: EnvironmentProvider = () => {
  const injected = readInjectedEnvironment();
  if (injected !== null) return injected;

  if (typeof window === 'undefined') return Environment.Production;

  const { hostname } = window.location;
  return isLocalHostname(hostname) ? Environment.Development : Environment.Production;
};

let activeEnvironmentProvider: EnvironmentProvider = detectEnvironment;

/**
 * 构建期变量的名字与读取方式随框架而异（`import.meta.env` / `process.env` / 全局常量），
 * 故由业务侧注入，请求层不绑定具体构建工具。
 */
export const setEnvironmentProvider = (provider: EnvironmentProvider) => {
  activeEnvironmentProvider = provider;
};

export const resetEnvironmentProvider = () => {
  activeEnvironmentProvider = detectEnvironment;
};

export const getEnvironment = (): Environment => activeEnvironmentProvider();
