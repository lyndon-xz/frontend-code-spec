import type { InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor } from '../types/interceptor';

/** 鉴权 token 读取实现；业务方可替换为内存 / cookie / 状态管理 */
export type AuthTokenProvider = () => string | null;

const AUTH_TOKEN_KEY = 'auth_token';

const defaultAuthTokenProvider: AuthTokenProvider = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

let authTokenProvider: AuthTokenProvider = defaultAuthTokenProvider;

/** 替换默认 token 读取实现 */
export const setAuthTokenProvider = (provider: AuthTokenProvider) => {
  authTokenProvider = provider;
};

/** 恢复为默认 localStorage 读取 */
export const resetAuthTokenProvider = () => {
  authTokenProvider = defaultAuthTokenProvider;
};

export const authReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    const token = authTokenProvider();
    if (token != null && token !== '') {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
};
