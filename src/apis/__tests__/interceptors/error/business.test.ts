import type { AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { businessErrorInterceptor } from '@/apis/interceptors/error/business';
import { RequestError, RequestErrorType } from '@/apis/utils/error';
import { resetErrorNotifier, setErrorNotifier } from '@/apis/utils/error-notifier';

const mockNotifyError = vi.fn();

const buildResponse = (
  data: unknown,
  config: AxiosResponse['config'] = {} as AxiosResponse['config'],
) => ({ data, config }) as AxiosResponse;

describe('businessErrorInterceptor.onFulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setErrorNotifier(mockNotifyError);
  });

  afterEach(() => {
    resetErrorNotifier();
  });

  it('非业务信封响应原样放行', () => {
    const response = buildResponse('raw-file-stream');

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result).toBe(response);
    expect(result.data).toBe('raw-file-stream');
  });

  it('成功码时拆包只暴露 data', () => {
    const response = buildResponse({ code: 0, message: 'ok', timestampMs: 1, data: { id: 9 } });

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result.data).toEqual({ id: 9 });
  });

  it('成功码但无 data 时归一为 null', () => {
    const response = buildResponse({ code: 0, message: 'ok', timestampMs: 1, data: undefined });

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result.data).toBeNull();
  });

  it('业务失败码默认弹出服务端文案并抛出 Business 错误', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestampMs: 1, data: null });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow(RequestError);
    expect(mockNotifyError).toHaveBeenCalledWith('库存不足');

    let thrown: unknown;

    try {
      businessErrorInterceptor.onFulfilled!(response);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(RequestError);
    expect((thrown as RequestError).type).toBe(RequestErrorType.Business);
    expect((thrown as RequestError).code).toBe(500);
  });

  it('服务端 message 为空时用兜底文案，不弹空提示', () => {
    const response = buildResponse({ code: 500, message: '', timestampMs: 1, data: null });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('操作失败，请稍后重试');
    expect(mockNotifyError).toHaveBeenCalledWith('操作失败，请稍后重试');
  });

  it('服务端未返回 message 字段时同样走兜底文案', () => {
    const response = buildResponse({ code: 500, timestampMs: 1, data: null });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('操作失败，请稍后重试');
  });

  it('配置 customMessage 时用自定义文案提示与报错', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestampMs: 1, data: null }, {
      businessError: { customMessage: '下单失败，请重试' },
    } as AxiosResponse['config']);

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('下单失败，请重试');
    expect(mockNotifyError).toHaveBeenCalledWith('下单失败，请重试');
  });

  it('配置 isSilent 时不弹出提示但仍抛错', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestampMs: 1, data: null }, {
      businessError: { isSilent: true },
    } as AxiosResponse['config']);

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow(RequestError);
    expect(mockNotifyError).not.toHaveBeenCalled();
  });
});
