import { createGetRequest, createPostRequest } from '../request';

export type FlightSortBy = 'price-asc' | 'price-desc' | 'departure-time' | 'duration';

export interface FlightListParams {
  departureCity: string;
  arrivalCity: string;
  /** 格式 YYYY-MM-DD */
  departureDate: string;
  sortBy: FlightSortBy;
}

export interface Flight {
  flightNo: string;
  airline: string;
  /** 机场三字码，如 PEK */
  departureAirport: string;
  arrivalAirport: string;
  departureTimeMs: number;
  arrivalTimeMs: number;
  /** 该航班的最低舱位价 */
  priceCents: number;
}

export interface FlightListResult {
  list: Flight[];
  total: number;
}

export type CabinClass = 'economy' | 'business' | 'first';

export interface FareOption {
  fareId: string;
  cabinClass: CabinClass;
  priceCents: number;
  seatsLeft: number;
  refundPolicy: string;
}

export interface FlightDetail {
  flightNo: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTimeMs: number;
  arrivalTimeMs: number;
  aircraftModel: string;
  fares: FareOption[];
}

export interface Passenger {
  fullName: string;
  idNumber: string;
}

export interface BookFlightPayload {
  flightNo: string;
  fareId: string;
  passengers: Passenger[];
}

export interface BookFlightResult {
  orderId: string;
}

const FLIGHT_SERVICE_CODE = '33251';

const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

/** 去重签名含 params，只挡同一筛选条件的连续触发 */
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

export const fetchFlightDetail = (flightNo: string) =>
  get<FlightDetail>({ url: '/flight/detail', params: { flightNo } });

export const fetchFlightDetailSilent = (flightNo: string) =>
  get<FlightDetail>({
    url: '/flight/detail',
    params: { flightNo },
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });

export const fetchFlightDetailWithCustomError = (flightNo: string) =>
  get<FlightDetail>({
    url: '/flight/detail',
    params: { flightNo },
    businessError: { customMessage: '获取航班信息失败，请稍后重试' },
  });

/** 变更类请求不重试、不去重 */
export const bookFlight = (payload: BookFlightPayload) =>
  post<BookFlightResult>({ url: '/flight/book', data: payload });

/** 错误交调用方自行处理，关掉默认提示 */
export const bookFlightOrThrow = (payload: BookFlightPayload) =>
  post<BookFlightResult>({
    url: '/flight/book',
    data: payload,
    isErrorSwallowed: false,
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });
