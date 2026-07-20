import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ssoInterceptor } from '@/apis/utils/interceptors/sso';

const buildResponse = (body: unknown) => ({ data: body }) as unknown as AxiosResponse;

describe('ssoInterceptor', () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the response when body is not an SSO payload', () => {
    const response = buildResponse({ foo: 'bar' });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('falls back to an empty object when the response itself is nullish', () => {
    const result = ssoInterceptor.onFulfilled!(undefined as unknown as AxiosResponse);

    expect(result).toBeUndefined();
  });

  it('returns the response when returncode is authorized', () => {
    const response = buildResponse({ returncode: 0 });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('throws when the redirect url is missing', () => {
    const response = buildResponse({ returncode: -100 });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址缺失');
  });

  it('throws when the redirect url is empty', () => {
    const response = buildResponse({ returncode: -100, redirectUrl: '' });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址缺失');
  });

  it('throws when the redirect url uses an unsafe protocol', () => {
    const response = buildResponse({ returncode: -100, redirectUrl: 'javascript:alert(1)' });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址非法');
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it('treats an unparseable redirect url as unsafe', () => {
    const response = buildResponse({ returncode: -100, redirectUrl: 'http://' });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址非法');
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });

  it('navigates through a temporary link and throws for a safe redirect', () => {
    const response = buildResponse({ returncode: -100, redirectUrl: 'https://sso.example.com/login' });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('用户未登录，正在跳转...');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });
});
