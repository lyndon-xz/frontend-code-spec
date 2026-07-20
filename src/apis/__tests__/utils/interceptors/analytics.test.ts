import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsReqInterceptor, analyticsResInterceptor } from '@/apis/utils/interceptors/analytics';

describe('analyticsReqInterceptor', () => {
  it('stamps a request id and start time onto the config', () => {
    const config = { method: 'post', url: '/api/x' } as unknown as InternalAxiosRequestConfig;

    const result = analyticsReqInterceptor.onFulfilled!(config);

    expect(typeof result.__requestId).toBe('string');
    expect(result.__requestId).toContain('POST_/api/x');
    expect(typeof result.__requestStartTime).toBe('number');
  });
});

describe('analyticsResInterceptor', () => {
  beforeEach(() => {
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('onFulfilled', () => {
    it('reports analytics when config carries id and start time', () => {
      const response = {
        data: { ok: true },
        config: {
          __requestId: 'POST_/api/x_1_0.5',
          __requestStartTime: 1000,
          url: '/api/x',
          method: 'post',
          params: { a: 1 },
        },
      } as unknown as AxiosResponse;

      const result = analyticsResInterceptor.onFulfilled!(response);

      expect(result).toBe(response);
      expect(console.group).toHaveBeenCalledWith('📊 [埋点上报] POST /api/x');
    });

    it('skips reporting when start time is missing', () => {
      const response = {
        data: {},
        config: { __requestId: 'id', url: '/api/x', method: 'post' },
      } as unknown as AxiosResponse;

      const result = analyticsResInterceptor.onFulfilled!(response);

      expect(result).toBe(response);
      expect(console.group).not.toHaveBeenCalled();
    });

    it('returns the response untouched when config is not an object', () => {
      const response = { data: {}, config: undefined } as unknown as AxiosResponse;

      expect(analyticsResInterceptor.onFulfilled!(response)).toBe(response);
      expect(console.group).not.toHaveBeenCalled();
    });

    it('falls back to an empty object when the response itself is nullish', () => {
      const result = analyticsResInterceptor.onFulfilled!(undefined as unknown as AxiosResponse);

      expect(result).toBeUndefined();
      expect(console.group).not.toHaveBeenCalled();
    });
  });

  describe('onRejected', () => {
    it('rejects non-axios errors without reporting', async () => {
      await expect(analyticsResInterceptor.onRejected!('boom')).rejects.toBe('boom');
      expect(console.group).not.toHaveBeenCalled();
    });

    it('reports an error entry then rejects for axios-like errors', async () => {
      const error = {
        message: 'timeout',
        config: {
          __requestId: 'id-1',
          __requestStartTime: 1000,
          url: '/api/x',
          method: 'post',
        },
      };

      await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
      expect(console.group).toHaveBeenCalledWith('📊 [埋点上报] POST /api/x');
      expect(console.log).toHaveBeenCalledWith('错误信息:', 'timeout');
    });

    it('falls back to a default message when the error message is empty', async () => {
      const error = {
        message: '',
        config: { __requestId: 'id-2', __requestStartTime: 1000, url: '/api/y', method: 'get' },
      };

      await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
      expect(console.log).toHaveBeenCalledWith('错误信息:', '未知错误');
    });

    it('falls back to an empty config and skips reporting when config is missing', async () => {
      const error = { message: 'boom', config: undefined };

      await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
      expect(console.group).not.toHaveBeenCalled();
    });
  });
});
