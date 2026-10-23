import type { InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor } from '../types/interceptors';

export type AuthTokenProvider = () => string | null;

/**
 * 登录侧写入、登出侧清除都要引用这个常量，别两边各写一遍字面量。
 * 业务侧若改用内存或 sessionStorage 存 token，走 setAuthTokenProvider 换掉默认实现即可。
 */
export const AUTH_TOKEN_KEY = 'auth_token';

const defaultAuthTokenProvider: AuthTokenProvider = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    /*
     * 隐私模式或禁用存储时 getItem 会抛。这里降级为匿名请求，但必须留下告警：
     * 否则「存储读不到」会以「用户未登录」的形式表现，用户重新登录后仍读不到，陷入死循环而无从排查。
     */
    console.warn('[auth] localStorage 不可用，本次请求降级为匿名:', error);
    return null;
  }
};

let readAuthToken: AuthTokenProvider = defaultAuthTokenProvider;

export const setAuthTokenProvider = (provider: AuthTokenProvider) => {
  readAuthToken = provider;
};

export const resetAuthTokenProvider = () => {
  readAuthToken = defaultAuthTokenProvider;
};

/*
 * axios 在 url 为绝对地址时会跳过 baseURL，因此仅凭「实例是本服务的」并不能保证请求打到本服务。
 * 配合实例默认的 withCredentials，一次指向第三方域的调用会把 token 与凭据一起送出去，故先比对 origin。
 */
const isSameOriginAsBaseUrl = (config: InternalAxiosRequestConfig): boolean => {
  const { url = '', baseURL } = config;

  try {
    const target = new URL(url, baseURL ?? window.location.origin);
    const expected = new URL(baseURL ?? window.location.origin, window.location.origin);

    return target.origin === expected.origin;
  } catch {
    // 解析不出目标就按「不可信」处理，不挂凭证
    return false;
  }
};

export const authReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    const token = readAuthToken();
    if (token != null && token !== '' && isSameOriginAsBaseUrl(config)) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
};
