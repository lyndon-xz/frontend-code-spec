import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type AnalyticsData,
  reportAnalytics,
  RequestStatus,
  resetAnalyticsSanitizer,
  resetAnalyticsSender,
  setAnalyticsSanitizer,
  setAnalyticsSender,
} from '@/apis/utils/analytics-reporter';
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
  startTimeMs: 1000,
  endTimeMs: 1200,
  ...overrides,
});

describe('reportAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAnalyticsSender();
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    resetAnalyticsSender();
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

  it('生产环境走可注入的上报实现', () => {
    mockGetEnvironment.mockReturnValue(Environment.Production);
    const sender = vi.fn();
    setAnalyticsSender(sender);
    const analyticsData = buildAnalyticsData();

    reportAnalytics(analyticsData);

    expect(sender).toHaveBeenCalledWith(analyticsData);
    expect(console.group).not.toHaveBeenCalled();
  });
});

describe('reportAnalytics 脱敏钩子', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvironment.mockReturnValue(Environment.Production);
  });

  afterEach(() => {
    resetAnalyticsSender();
    resetAnalyticsSanitizer();
  });

  it('生产环境把载荷交给脱敏钩子处理后才上报', () => {
    const sender = vi.fn();
    setAnalyticsSender(sender);
    setAnalyticsSanitizer((analyticsData) => ({ ...analyticsData, requestParams: '[已脱敏]' }));

    reportAnalytics(buildAnalyticsData({ requestParams: { idNumber: '110101' } }));

    expect(sender).toHaveBeenCalledWith(expect.objectContaining({ requestParams: '[已脱敏]' }));
  });

  it('未注入脱敏钩子时载荷原样上报', () => {
    const sender = vi.fn();
    setAnalyticsSender(sender);
    const analyticsData = buildAnalyticsData();

    reportAnalytics(analyticsData);

    expect(sender).toHaveBeenCalledWith(analyticsData);
  });
});
