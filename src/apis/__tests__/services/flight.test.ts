import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bookFlight,
  bookFlightOrThrow,
  fetchFlightDetail,
  fetchFlightDetailSilent,
  fetchFlightDetailWithCustomError,
  fetchFlights,
} from '@/apis/services/flight';

// get / post 在模块加载期即被创建，用 hoisted 让工厂能引用到间谍
const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock('@/apis/request', () => ({
  createGetRequest: vi.fn(() => mockGet),
  createPostRequest: vi.fn(() => mockPost),
}));

describe('flight service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(null);
    mockPost.mockResolvedValue(null);
  });

  it('fetchFlights 开启去重与重试并透传返回值', async () => {
    const result = { list: [], total: 0 };
    mockGet.mockResolvedValue(result);
    const query = {
      departureCity: 'BJS',
      arrivalCity: 'SHA',
      departureDate: '2026-08-01',
      sortBy: 'price-asc' as const,
    };

    await expect(fetchFlights(query)).resolves.toBe(result);
    expect(mockGet).toHaveBeenCalledWith({
      url: '/api/flight/list',
      params: query,
      isDeduped: true,
      retry: { count: 2 },
    });
  });

  it('fetchFlightDetail 按航班号查询详情', async () => {
    await fetchFlightDetail('CA1234');

    expect(mockGet).toHaveBeenCalledWith({
      url: '/api/flight/detail',
      params: { flightNo: 'CA1234' },
    });
  });

  it('fetchFlightDetailSilent 静默业务与网络错误', async () => {
    await fetchFlightDetailSilent('CA1234');

    expect(mockGet).toHaveBeenCalledWith({
      url: '/api/flight/detail',
      params: { flightNo: 'CA1234' },
      businessError: { isSilent: true },
      networkError: { isSilent: true },
    });
  });

  it('fetchFlightDetailWithCustomError 使用自定义错误文案', async () => {
    await fetchFlightDetailWithCustomError('CA1234');

    expect(mockGet).toHaveBeenCalledWith({
      url: '/api/flight/detail',
      params: { flightNo: 'CA1234' },
      businessError: { customMessage: '获取航班信息失败，请稍后重试' },
    });
  });

  it('bookFlight 以 POST 提交预订数据', async () => {
    const payload = {
      flightNo: 'CA1234',
      fareId: 'F1',
      passengers: [{ fullName: '张三', idNumber: '110101' }],
    };

    await bookFlight(payload);

    expect(mockPost).toHaveBeenCalledWith({ url: '/api/flight/book', data: payload });
  });

  it('bookFlightOrThrow 关闭吞错并静默提示以便调用方自处理', async () => {
    const payload = { flightNo: 'CA1234', fareId: 'F1', passengers: [] };

    await bookFlightOrThrow(payload);

    expect(mockPost).toHaveBeenCalledWith({
      url: '/api/flight/book',
      data: payload,
      isErrorSwallowed: false,
      businessError: { isSilent: true },
      networkError: { isSilent: true },
    });
  });
});
