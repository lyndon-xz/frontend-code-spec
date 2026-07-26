import type { InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor } from '../types/interceptor';

const AUTH_TOKEN_KEY = 'auth_token';

// 读取鉴权 token；实际项目可替换为从内存 / cookie / 状态管理读取
const getAuthToken = (): string | null => {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const authReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token != null && token !== '') {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
};
