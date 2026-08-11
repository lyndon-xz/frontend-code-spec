import type { InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor } from '../types/interceptor';

export type AuthTokenProvider = () => string | null;

const AUTH_TOKEN_KEY = 'auth_token';

const defaultAuthTokenProvider: AuthTokenProvider = () => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

let activeAuthTokenProvider: AuthTokenProvider = defaultAuthTokenProvider;

export const setAuthTokenProvider = (provider: AuthTokenProvider) => {
  activeAuthTokenProvider = provider;
};

export const resetAuthTokenProvider = () => {
  activeAuthTokenProvider = defaultAuthTokenProvider;
};

export const authReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    const token = activeAuthTokenProvider();
    if (token != null && token !== '') {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
};
