import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UNAUTHORIZED_CODE } from '@/apis/constants/codes';
import type { ResInterceptor } from '@/apis/types/interceptors';

// isRedirecting 是模块级状态，靠 resetModules + 动态导入隔离；RequestError 同源导入才让 instanceof 成立
let ssoInterceptor: ResInterceptor;
let resetSsoRedirectState: typeof import('@/apis/interceptors/sso').resetSsoRedirectState;
let RequestError: typeof import('@/apis/utils/error').RequestError;
let RequestErrorType: typeof import('@/apis/utils/error').RequestErrorType;

beforeEach(async () => {
  vi.resetModules();
  vi.restoreAllMocks();
  ({ ssoInterceptor, resetSsoRedirectState } = await import('@/apis/interceptors/sso'));
  ({ RequestError, RequestErrorType } = await import('@/apis/utils/error'));
});

const buildResponse = (data: unknown) => ({ data, config: {} }) as AxiosResponse;

describe('ssoInterceptor.onFulfilled', () => {
  it('非 SSO 响应（无 returncode）原样放行', () => {
    const response = buildResponse({ code: 0 });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('returncode 非未授权码时原样放行', () => {
    const response = buildResponse({ returncode: 0 });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  // 谓词若只查字段存在性，"-100" !== -100 会让未授权响应被当成已登录放行
  it('returncode 为字符串时不视为 SSO 响应', () => {
    const response = buildResponse({ returncode: String(UNAUTHORIZED_CODE) });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('未授权但缺少跳转地址时抛出地址缺失错误', () => {
    const response = buildResponse({ returncode: UNAUTHORIZED_CODE });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址缺失');
  });

  it('跳转地址为危险协议时抛出地址非法错误', () => {
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      // 拆开写，源码里才不会出现被 no-script-url 拦住的协议字面量；运行时仍是要拦下的地址
      redirectUrl: ['java', 'script:alert(1)'].join(''),
    });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址非法');
  });

  it('跳转地址无法解析时抛出地址非法错误', () => {
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      redirectUrl: 'http://[',
    });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow('SSO 重定向地址非法');
  });

  it('合法跳转地址触发一次跳转并抛出未登录错误', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      redirectUrl: 'https://sso.example.com/login',
    });

    let thrown: unknown;

    try {
      ssoInterceptor.onFulfilled!(response);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RequestError);
    const requestError = thrown as InstanceType<typeof RequestError>;
    expect(requestError.type).toBe(RequestErrorType.Unauthorized);
    expect(requestError.message).toBe('用户未登录，正在跳转...');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('已在跳转中时不再触发第二次跳转但仍抛错', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      redirectUrl: 'https://sso.example.com/login',
    });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow(RequestError);
    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow(RequestError);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('复位跳转状态后可再次触发跳转', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      redirectUrl: 'https://sso.example.com/login',
    });

    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow(RequestError);
    resetSsoRedirectState();
    expect(() => ssoInterceptor.onFulfilled!(response)).toThrow(RequestError);

    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});

describe('信封归属与协议收紧', () => {
  it('同时带 code 的响应体让给业务信封，SSO 不抢先接管', () => {
    // 本拦截器排在业务拦截器之前，不排除的话带 returncode 的业务响应会被误接管
    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      code: 0,
      data: { ok: true },
    });

    expect(ssoInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('生产环境拒绝 http 跳转地址', async () => {
    vi.doMock('@/utils/environment', () => ({
      getEnvironment: () => 'production',
    }));
    vi.resetModules();
    const { ssoInterceptor: interceptor } = await import('@/apis/interceptors/sso');
    const { RequestError: Err } = await import('@/apis/utils/error');

    const response = buildResponse({
      returncode: UNAUTHORIZED_CODE,
      redirectUrl: 'http://sso.example.com/login',
    });

    expect(() => interceptor.onFulfilled!(response)).toThrow(Err);
    vi.doUnmock('@/utils/environment');
  });
});
