import { APP_ENV_KEY, Environment } from '@/constants/environment';

import { createSwappable } from './swappable';

export type EnvironmentProvider = () => Environment;

// 只认已知取值，拼错或注入了别的值时视为未注入并继续兜底；取值清单只有枚举这一个来源，加档不必改此处
const readInjectedEnvironment = (): Environment | null => {
  const injected = typeof process === 'undefined' ? undefined : process.env[APP_ENV_KEY];

  return Object.values(Environment).find((environment) => environment === injected) ?? null;
};

// 指向本机的域名，未注入构建期标识时用于兜底判断
const LOCAL_HOSTNAMES = ['localhost', '0.0.0.0', '::1', '[::1]'];

// 回环网段 127.0.0.0/8 整段都是本机，不止 127.0.0.1；按四段点分十进制校验，避免把 127.example.com 当本机
const LOOPBACK_HOSTNAME_PATTERN = /^127(\.\d{1,3}){3}$/;

// mDNS 与局域网自签域名后缀，如 my-mac.local
const LOCAL_HOSTNAME_SUFFIX = '.local';

const isLocalHostname = (hostname: string): boolean => {
  if (LOCAL_HOSTNAMES.includes(hostname)) {
    return true;
  }
  if (LOOPBACK_HOSTNAME_PATTERN.test(hostname)) {
    return true;
  }
  return hostname.endsWith(LOCAL_HOSTNAME_SUFFIX);
};

// 构建期注入的 APP_ENV 为唯一可信来源；取不到 window 时按生产处理
const detectEnvironment: EnvironmentProvider = () => {
  const injected = readInjectedEnvironment();
  if (injected !== null) {
    return injected;
  }

  if (typeof window === 'undefined') {
    return Environment.Production;
  }

  const { hostname } = window.location;
  return isLocalHostname(hostname) ? Environment.Development : Environment.Production;
};

const environmentProviderSlot = createSwappable(detectEnvironment);

/** 构建期变量的读取方式随框架而异，由业务侧注入 */
export const setEnvironmentProvider = environmentProviderSlot.set;

export const resetEnvironmentProvider = environmentProviderSlot.reset;

export const getEnvironment = (): Environment => environmentProviderSlot.get()();
