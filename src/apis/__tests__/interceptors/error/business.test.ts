import { message } from 'antd';
import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { businessErrorInterceptor } from '@/apis/interceptors/error/business';
import { RequestError, RequestErrorType } from '@/apis/utils/error';

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

const mockMessageError = vi.mocked(message.error);

const buildResponse = (
  data: unknown,
  config: AxiosResponse['config'] = {} as AxiosResponse['config'],
) => ({ data, config }) as AxiosResponse;

describe('businessErrorInterceptor.onFulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非业务信封响应原样放行', () => {
    const response = buildResponse('raw-file-stream');

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result).toBe(response);
    expect(result.data).toBe('raw-file-stream');
  });

  it('成功码时拆包只暴露 data', () => {
    const response = buildResponse({ code: 0, message: 'ok', timestamp: 1, data: { id: 9 } });

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result.data).toEqual({ id: 9 });
  });

  it('成功码但无 data 时归一为 null', () => {
    const response = buildResponse({ code: 0, message: 'ok', timestamp: 1, data: undefined });

    const result = businessErrorInterceptor.onFulfilled!(response);

    expect(result.data).toBeNull();
  });

  it('业务失败码默认弹出服务端文案并抛出 Business 错误', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestamp: 1, data: null });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow(RequestError);
    expect(mockMessageError).toHaveBeenCalledWith('库存不足');

    try {
      businessErrorInterceptor.onFulfilled!(response);
    } catch (error) {
      expect(error).toBeInstanceOf(RequestError);
      expect((error as RequestError).type).toBe(RequestErrorType.Business);
      expect((error as RequestError).code).toBe(500);
    }
  });

  it('配置 customMessage 时用自定义文案提示与报错', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestamp: 1, data: null }, {
      businessError: { customMessage: '下单失败，请重试' },
    } as AxiosResponse['config']);

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('下单失败，请重试');
    expect(mockMessageError).toHaveBeenCalledWith('下单失败，请重试');
  });

  it('配置 isSilent 时不弹出提示但仍抛错', () => {
    const response = buildResponse({ code: 500, message: '库存不足', timestamp: 1, data: null }, {
      businessError: { isSilent: true },
    } as AxiosResponse['config']);

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow(RequestError);
    expect(mockMessageError).not.toHaveBeenCalled();
  });
});
