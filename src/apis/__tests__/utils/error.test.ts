import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  classifyAxiosError,
  isRetryableError,
  RequestError,
  RequestErrorType,
} from '@/apis/utils/error';

// 构造一个带 response 的 AxiosError，用于走 HTTP 状态码分支
const buildAxiosError = (overrides: Partial<AxiosError> = {}): AxiosError => {
  const error = new AxiosError('boom');
  error.config = { headers: new AxiosHeaders() };
  return Object.assign(error, overrides);
};

describe('RequestError', () => {
  it('携带 type、message 与 meta 中的 status/code/config', () => {
    const config = { url: '/x' };
    const error = new RequestError(RequestErrorType.Http, '出错了', {
      status: 500,
      code: 42,
      config,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('RequestError');
    expect(error.type).toBe(RequestErrorType.Http);
    expect(error.message).toBe('出错了');
    expect(error.status).toBe(500);
    expect(error.code).toBe(42);
    expect(error.config).toBe(config);
  });

  it('meta 缺省时 status/code/config 为 undefined', () => {
    const error = new RequestError(RequestErrorType.Network, '网络错误');

    expect(error.status).toBeUndefined();
    expect(error.code).toBeUndefined();
    expect(error.config).toBeUndefined();
  });
});

describe('classifyAxiosError', () => {
  it('原样返回已是 RequestError 的错误', () => {
    const original = new RequestError(RequestErrorType.Business, '业务错误', { code: 1 });

    expect(classifyAxiosError(original)).toBe(original);
  });

  it('取消类错误归一为 Canceled 并携带 config', () => {
    const config = { headers: new AxiosHeaders() };
    const canceled = new CanceledError('canceled');
    Object.assign(canceled, { config });

    const result = classifyAxiosError(canceled);

    expect(result.type).toBe(RequestErrorType.Canceled);
    expect(result.message).toBe('请求已取消');
    expect(result.config).toBe(config);
  });

  it('ECONNABORTED 归一为 Timeout', () => {
    const result = classifyAxiosError(buildAxiosError({ code: 'ECONNABORTED' }));

    expect(result.type).toBe(RequestErrorType.Timeout);
    expect(result.message).toBe('请求超时，请稍后重试');
  });

  it('ETIMEDOUT 归一为 Timeout', () => {
    const result = classifyAxiosError(buildAxiosError({ code: 'ETIMEDOUT' }));

    expect(result.type).toBe(RequestErrorType.Timeout);
  });

  it('401 归一为 Unauthorized 并使用对应文案', () => {
    const error = buildAxiosError();
    error.response = { status: 401 } as AxiosError['response'];

    const result = classifyAxiosError(error);

    expect(result.type).toBe(RequestErrorType.Unauthorized);
    expect(result.status).toBe(401);
    expect(result.message).toBe('登录已失效，请重新登录');
  });

  it('已知 4xx 状态码归一为 Http 并使用映射文案', () => {
    const error = buildAxiosError();
    error.response = { status: 404 } as AxiosError['response'];

    const result = classifyAxiosError(error);

    expect(result.type).toBe(RequestErrorType.Http);
    expect(result.message).toBe('请求的资源不存在');
  });

  it('未映射的 5xx 使用服务器兜底文案', () => {
    const error = buildAxiosError();
    error.response = { status: 599 } as AxiosError['response'];

    const result = classifyAxiosError(error);

    expect(result.type).toBe(RequestErrorType.Http);
    expect(result.message).toBe('服务器开小差了，请稍后重试');
  });

  it('未映射的 4xx 使用中性文案，不归因到网络', () => {
    const error = buildAxiosError();
    error.response = { status: 418 } as AxiosError['response'];

    const result = classifyAxiosError(error);

    expect(result.type).toBe(RequestErrorType.Http);
    expect(result.message).toBe('请求失败，请稍后重试');
  });

  it('无 response 的 AxiosError 归一为 Network 并携带 config', () => {
    const error = buildAxiosError();

    const result = classifyAxiosError(error);

    expect(result.type).toBe(RequestErrorType.Network);
    expect(result.message).toBe('网络连接失败，请检查网络后重试');
    // config 是下游抑制重试提示与串联埋点的唯一入口，网络错误分支同样必须带上
    expect(result.config).toBe(error.config);
  });

  it('非 axios 的错误归一为 Unknown 并保留原始错误', () => {
    const original = new Error('interceptor boom');

    const result = classifyAxiosError(original);

    expect(result.type).toBe(RequestErrorType.Unknown);
    expect(result.message).toBe('请求出现异常，请稍后重试');
    expect(result.cause).toBe(original);
    expect(result.config).toBeUndefined();
  });
});

describe('isRetryableError', () => {
  it('非 RequestError 一律不可重试', () => {
    expect(isRetryableError(new Error('x'))).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });

  it('网络与超时错误可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Network, ''))).toBe(true);
    expect(isRetryableError(new RequestError(RequestErrorType.Timeout, ''))).toBe(true);
  });

  it('5xx 的 Http 错误可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Http, '', { status: 503 }))).toBe(
      true,
    );
  });

  it('4xx 的 Http 错误不可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Http, '', { status: 404 }))).toBe(
      false,
    );
  });

  it('无 status 的 Http 错误不可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Http, ''))).toBe(false);
  });

  it('业务错误不可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Business, '', { code: 1 }))).toBe(
      false,
    );
  });

  it('未知异常不可重试', () => {
    expect(isRetryableError(new RequestError(RequestErrorType.Unknown, ''))).toBe(false);
  });
});
