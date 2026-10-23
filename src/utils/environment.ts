import { APP_ENV_KEY, Environment } from '@/constants/environment';

// 只认已知取值，拼错或没注入都按生产。取值清单只有枚举这一个来源
const readInjectedEnvironment = (): Environment | null => {
  const injected = typeof process === 'undefined' ? undefined : process.env[APP_ENV_KEY];

  return Object.values(Environment).find((environment) => environment === injected) ?? null;
};

/** 只认构建期注入的 APP_ENV。没有或拼错时按生产处理 */
export const getEnvironment = (): Environment => {
  return readInjectedEnvironment() ?? Environment.Production;
};
