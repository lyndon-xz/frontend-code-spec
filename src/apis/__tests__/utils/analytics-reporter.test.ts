import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsData } from '@/apis/utils/analytics-reporter';
import { reportAnalytics, RequestStatus } from '@/apis/utils/analytics-reporter';
import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

vi.mock('@/utils/environment', () => ({
  getEnvironment: vi.fn(),
}));

const mockGetEnvironment = vi.mocked(getEnvironment);

const buildAnalyticsData = (overrides: Partial<AnalyticsData> = {}): AnalyticsData => ({
  requestId: 'GET_/x_1',
  method: 'GET',
  url: '/x',
  requestParams: { params: { a: 1 } },
  responseData: { ok: true },
  status: RequestStatus.Success,
  startTime: 1000,
  endTime: 1200,
  ...overrides,
});

describe('reportAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  it('开发环境成功请求打印分组日志并输出返回数据', () => {
    mockGetEnvironment.mockReturnValue(Environment.Development);

    reportAnalytics(buildAnalyticsData());

    expect(console.group).toHaveBeenCalledWith('[埋点上报] GET /x');
    expect(console.log).toHaveBeenCalledWith('返回数据:', { ok: true });
    expect(console.groupEnd).toHaveBeenCalledTimes(1);
  });

  it('开发环境失败请求输出错误信息而非返回数据', () => {
    mockGetEnvironment.mockReturnValue(Environment.Development);

    reportAnalytics(
      buildAnalyticsData({
        status: RequestStatus.Error,
        responseData: null,
        errorMessage: '业务失败',
      }),
    );

    expect(console.log).toHaveBeenCalledWith('错误信息:', '业务失败');
    expect(console.log).not.toHaveBeenCalledWith('返回数据:', expect.anything());
  });

  it('生产环境不打印控制台日志', () => {
    mockGetEnvironment.mockReturnValue(Environment.Production);

    reportAnalytics(buildAnalyticsData());

    expect(console.group).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
