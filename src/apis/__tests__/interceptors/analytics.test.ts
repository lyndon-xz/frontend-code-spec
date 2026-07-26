import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsReqInterceptor, analyticsResInterceptor } from '@/apis/interceptors/analytics';
import { reportAnalytics, RequestStatus } from '@/apis/utils/analytics-reporter';
import { RequestError, RequestErrorType } from '@/apis/utils/error';

vi.mock('@/apis/utils/analytics-reporter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/apis/utils/analytics-reporter')>();
  return { ...actual, reportAnalytics: vi.fn() };
});

const mockReportAnalytics = vi.mocked(reportAnalytics);

// 构造一段已经过埋点请求拦截器的 config（含 __requestId / __requestStartTime）
const buildTracedConfig = () =>
  ({
    __requestId: 'GET_/x_1',
    __requestStartTime: 1000,
    url: '/x',
    method: 'get',
    params: { a: 1 },
  }) as InternalAxiosRequestConfig;

describe('analyticsReqInterceptor.onFulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('写入 __requestId 与 __requestStartTime', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345);
    const config = { url: '/x', method: 'get' } as InternalAxiosRequestConfig;

    const result = analyticsReqInterceptor.onFulfilled!(config);

    expect(typeof result.__requestId).toBe('string');
    expect(result.__requestId).toContain('GET');
    expect(result.__requestStartTime).toBe(12345);
  });
});

describe('analyticsResInterceptor.onFulfilled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('存在 trace 时以成功状态上报并原样返回响应', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    const response = {
      data: { ok: true },
      config: buildTracedConfig(),
    } as AxiosResponse;

    const result = analyticsResInterceptor.onFulfilled!(response);

    expect(result).toBe(response);
    expect(mockReportAnalytics).toHaveBeenCalledTimes(1);
    expect(mockReportAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'GET_/x_1',
        status: RequestStatus.Success,
        responseData: { ok: true },
        endTime: 2000,
      }),
    );
  });

  it('缺少 trace 字段时跳过上报', () => {
    const response = { data: { ok: true }, config: { url: '/x' } } as AxiosResponse;

    const result = analyticsResInterceptor.onFulfilled!(response);

    expect(result).toBe(response);
    expect(mockReportAnalytics).not.toHaveBeenCalled();
  });
});

describe('analyticsResInterceptor.onRejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非 RequestError 直接透传拒绝且不上报', async () => {
    const raw = new Error('raw');

    await expect(analyticsResInterceptor.onRejected!(raw)).rejects.toBe(raw);
    expect(mockReportAnalytics).not.toHaveBeenCalled();
  });

  it('带 trace 的 RequestError 以失败状态上报后继续拒绝', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(3000);
    const error = new RequestError(RequestErrorType.Business, '业务失败', {
      config: buildTracedConfig(),
    });

    await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockReportAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        status: RequestStatus.Error,
        responseData: null,
        errorMessage: '业务失败',
        endTime: 3000,
      }),
    );
  });

  it('错误 message 为空时上报为未知错误', async () => {
    const error = new RequestError(RequestErrorType.Http, '', {
      config: buildTracedConfig(),
    });

    await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockReportAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: '未知错误' }),
    );
  });

  it('取消类错误不上报但仍拒绝', async () => {
    const error = new RequestError(RequestErrorType.Canceled, '请求已取消', {
      config: buildTracedConfig(),
    });

    await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockReportAnalytics).not.toHaveBeenCalled();
  });

  it('无 trace 的 RequestError 不上报但仍拒绝', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络错误');

    await expect(analyticsResInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockReportAnalytics).not.toHaveBeenCalled();
  });
});
