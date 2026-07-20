import { message } from 'antd';
import type { AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { businessErrorInterceptor } from '@/apis/utils/interceptors/error/business';

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

const mockMessageError = vi.mocked(message.error);

const buildResponse = (body: unknown, config: unknown = {}) => ({ data: body, config }) as unknown as AxiosResponse;

describe('businessErrorInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the response when data is null', () => {
    const response = buildResponse(null);

    expect(businessErrorInterceptor.onFulfilled!(response)).toBe(response);
  });

  it('falls back to an empty object when the response itself is nullish', () => {
    const result = businessErrorInterceptor.onFulfilled!(undefined as unknown as AxiosResponse);

    expect(result).toBeUndefined();
  });

  it('treats a non-object config as having no business error and still throws', () => {
    const response = buildResponse({ code: 500, message: '业务失败' }, null);

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('业务失败');
    expect(mockMessageError).toHaveBeenCalledWith('业务失败');
  });

  it('returns the response on the success code', () => {
    const response = buildResponse({ code: 0, message: 'ok' });

    expect(businessErrorInterceptor.onFulfilled!(response)).toBe(response);
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('shows the server message and throws on a business error', () => {
    const response = buildResponse({ code: 500, message: '业务失败' });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('业务失败');
    expect(mockMessageError).toHaveBeenCalledWith('业务失败');
  });

  it('prefers the custom message over the server message', () => {
    const response = buildResponse(
      { code: 500, message: '业务失败' },
      { businessError: { customMessage: '自定义提示' } },
    );

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('自定义提示');
    expect(mockMessageError).toHaveBeenCalledWith('自定义提示');
  });

  it('stays silent but still throws when isSilent is set', () => {
    const response = buildResponse({ code: 500, message: '业务失败' }, { businessError: { isSilent: true } });

    expect(() => businessErrorInterceptor.onFulfilled!(response)).toThrow('业务失败');
    expect(mockMessageError).not.toHaveBeenCalled();
  });
});
