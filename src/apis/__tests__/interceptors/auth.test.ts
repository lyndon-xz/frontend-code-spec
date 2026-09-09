import type { InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authReqInterceptor,
  resetAuthTokenProvider,
  setAuthTokenProvider,
} from '@/apis/interceptors/auth';

const AUTH_TOKEN_KEY = 'auth_token';

// 用带 set 间谍的 headers 直接断言注入行为，避开 AxiosHeaders 内部实现细节
const buildConfig = () => {
  const set = vi.fn();
  const config = { headers: { set } } as unknown as InternalAxiosRequestConfig;
  return { config, set };
};

describe('authReqInterceptor.onFulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetAuthTokenProvider();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetAuthTokenProvider();
  });

  it('存在 token 时注入 Authorization 头', () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'abc123');
    const { config, set } = buildConfig();

    const result = authReqInterceptor.onFulfilled!(config);

    expect(set).toHaveBeenCalledWith('Authorization', 'Bearer abc123');
    expect(result).toBe(config);
  });

  it('token 不存在时不注入 Authorization 头', () => {
    const { config, set } = buildConfig();

    authReqInterceptor.onFulfilled!(config);

    expect(set).not.toHaveBeenCalled();
  });

  it('token 为空字符串时不注入 Authorization 头', () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, '');
    const { config, set } = buildConfig();

    authReqInterceptor.onFulfilled!(config);

    expect(set).not.toHaveBeenCalled();
  });

  it('读取 localStorage 抛错时降级为不注入', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    const { config, set } = buildConfig();

    authReqInterceptor.onFulfilled!(config);

    expect(set).not.toHaveBeenCalled();
  });

  it('自定义 token provider 优先生效', () => {
    setAuthTokenProvider(() => 'from-memory');
    const { config, set } = buildConfig();

    authReqInterceptor.onFulfilled!(config);

    expect(set).toHaveBeenCalledWith('Authorization', 'Bearer from-memory');
  });
});

describe('authReqInterceptor 的凭证外发防线', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthTokenProvider();
    setAuthTokenProvider(() => 'abc123');
  });

  afterEach(() => {
    resetAuthTokenProvider();
  });

  // axios 在 url 为绝对地址时会跳过 baseURL，光看实例不能保证请求打到本服务
  const buildConfigWithUrl = (url: string, baseURL?: string) => {
    const set = vi.fn();
    const config = { headers: { set }, url, baseURL } as unknown as InternalAxiosRequestConfig;
    return { config, set };
  };

  it('相对路径落在实例 baseURL 上，注入 token', () => {
    const { config, set } = buildConfigWithUrl('/flight/list', 'https://api.example.com/api/1');
    authReqInterceptor.onFulfilled!(config);
    expect(set).toHaveBeenCalledWith('Authorization', 'Bearer abc123');
  });

  it('同源的绝对地址仍注入 token', () => {
    const { config, set } = buildConfigWithUrl(
      'https://api.example.com/api/1/flight/list',
      'https://api.example.com/api/1',
    );
    authReqInterceptor.onFulfilled!(config);
    expect(set).toHaveBeenCalledWith('Authorization', 'Bearer abc123');
  });

  it('指向第三方域的绝对地址不注入 token', () => {
    const { config, set } = buildConfigWithUrl(
      'https://third-party.example/collect',
      'https://api.example.com/api/1',
    );
    authReqInterceptor.onFulfilled!(config);
    expect(set).not.toHaveBeenCalled();
  });
});
