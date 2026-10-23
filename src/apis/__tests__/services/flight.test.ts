import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createGetRequest, createPostRequest } from '@/apis/request';
import {
  bookFlight,
  fetchFlightDetail,
  fetchFlights,
  SILENT_ERROR_HANDLING,
  THROWN_ERROR_HANDLING,
} from '@/apis/services/flight';
import { REQUEST_CAPABILITIES } from '@/apis/types/request/options';

// get / post 在模块加载期即被创建，用 hoisted 让工厂能引用到间谍
const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock('@/apis/request', () => ({
  createGetRequest: vi.fn(() => mockGet),
  createPostRequest: vi.fn(() => mockPost),
}));

describe('flight service', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
    mockGet.mockResolvedValue(null);
    mockPost.mockResolvedValue(null);
  });

  it('创建请求时列入全部能力', () => {
    expect(createGetRequest).toHaveBeenCalledWith('33251', {
      capabilities: REQUEST_CAPABILITIES,
    });
    expect(createPostRequest).toHaveBeenCalledWith('33251', {
      capabilities: REQUEST_CAPABILITIES,
    });
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
      url: '/flight/list',
      params: query,
      isDeduped: true,
      retry: { count: 2 },
    });
  });

  it('fetchFlightDetail 不传错误策略时只带 url 与参数', async () => {
    await fetchFlightDetail('CA1234');

    expect(mockGet).toHaveBeenCalledWith({
      url: '/flight/detail',
      params: { flightNo: 'CA1234' },
    });
  });

  it('fetchFlightDetail 透传静默策略', async () => {
    await fetchFlightDetail('CA1234', SILENT_ERROR_HANDLING);

    expect(mockGet).toHaveBeenCalledWith({
      url: '/flight/detail',
      params: { flightNo: 'CA1234' },
      businessError: { isSilent: true },
      networkError: { isSilent: true },
    });
  });

  it('fetchFlightDetail 透传自定义错误文案', async () => {
    await fetchFlightDetail('CA1234', {
      businessError: { customMessage: '获取航班信息失败，请稍后重试' },
    });

    expect(mockGet).toHaveBeenCalledWith({
      url: '/flight/detail',
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

    expect(mockPost).toHaveBeenCalledWith({ url: '/flight/book', data: payload });
  });

  it('bookFlight 透传抛错策略时关闭吞错并静默提示', async () => {
    const payload = { flightNo: 'CA1234', fareId: 'F1', passengers: [] };

    await bookFlight(payload, THROWN_ERROR_HANDLING);

    expect(mockPost).toHaveBeenCalledWith({
      url: '/flight/book',
      data: payload,
      isErrorSwallowed: false,
      businessError: { isSilent: true },
      networkError: { isSilent: true },
    });
  });
});
