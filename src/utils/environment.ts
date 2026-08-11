import {
  APP_ENV_KEY,
  Environment,
  LOCAL_HOSTNAME_SUFFIX,
  LOCAL_HOSTNAMES,
  LOOPBACK_HOSTNAME_PREFIX,
} from '@/constants/environment';

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

// 构建期注入的 APP_ENV 为唯一可信来源；取不到 window 时按生产处理，避免调试旁路带到服务端
const detectEnvironment: EnvironmentProvider = () => {
  const injected = readInjectedEnvironment();
  if (injected !== null) return injected;

  if (typeof window === 'undefined') return Environment.Production;

  const { hostname } = window.location;
  return isLocalHostname(hostname) ? Environment.Development : Environment.Production;
};

let activeEnvironmentProvider: EnvironmentProvider = detectEnvironment;

/** 构建期变量的名字与读取方式随框架而异，故由业务侧注入，请求层不绑定构建工具 */
export const setEnvironmentProvider = (provider: EnvironmentProvider) => {
  activeEnvironmentProvider = provider;
};

export const resetEnvironmentProvider = () => {
  activeEnvironmentProvider = detectEnvironment;
};

export const getEnvironment = (): Environment => activeEnvironmentProvider();
