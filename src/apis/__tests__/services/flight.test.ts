import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock('@/apis/request', () => ({
  createPostRequest: vi.fn(() => mockRequest),
}));

import { createPostRequest } from '@/apis/request';
import type { FlightListParams } from '@/apis/services/flight';
import {
  bookFlight,
  fetchFlightDetail,
  fetchFlightDetailSilent,
  fetchFlightDetailWithCustomError,
  fetchFlights,
} from '@/apis/services/flight';

describe('flight service', () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockRequest.mockResolvedValue({});
  });

  it('binds the request to the flight service code', () => {
    expect(createPostRequest).toHaveBeenCalledWith('33251');
  });

  it('fetchFlights forwards the query params', async () => {
    const query: FlightListParams = {
      departureCity: 'BJS',
      arrivalCity: 'SHA',
      departureDate: '2026-08-01',
      sortBy: 'price-asc',
    };

    await fetchFlights(query);

    expect(mockRequest).toHaveBeenCalledWith({ url: '/api/flight/list', params: query });
  });

  it('fetchFlightDetail posts the flight number', async () => {
    await fetchFlightDetail('CA1234');

    expect(mockRequest).toHaveBeenCalledWith({ url: '/api/flight/detail', params: { flightNo: 'CA1234' } });
  });

  it('fetchFlightDetailSilent silences business and network errors', async () => {
    await fetchFlightDetailSilent('CA1234');

    expect(mockRequest).toHaveBeenCalledWith({
      url: '/api/flight/detail',
      params: { flightNo: 'CA1234' },
      businessError: { isSilent: true },
      networkError: { isSilent: true },
    });
  });

  it('fetchFlightDetailWithCustomError passes a custom business message', async () => {
    await fetchFlightDetailWithCustomError('CA1234');

    expect(mockRequest).toHaveBeenCalledWith({
      url: '/api/flight/detail',
      params: { flightNo: 'CA1234' },
      businessError: { customMessage: '获取航班信息失败，请稍后重试' },
    });
  });

  it('bookFlight forwards the payload', async () => {
    const payload = {
      flightNo: 'CA1234',
      fareId: 'f1',
      passengers: [{ fullName: '张三', idNumber: '110101199001010011' }],
    };

    await bookFlight(payload);

    expect(mockRequest).toHaveBeenCalledWith({ url: '/api/flight/book', params: payload });
  });
});
