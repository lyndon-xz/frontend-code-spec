import { createGetRequest, createPostRequest } from '../request';

/** 航班排序方式 */
export type FlightSortBy = 'price-asc' | 'price-desc' | 'departure-time' | 'duration';

/** 舱位等级 */
export type CabinClass = 'economy' | 'business' | 'first';

/** 航班列表项 */
export interface Flight {
  /** 航班号，如 CA1234 */
  flightNo: string;
  airline: string;
  /** 出发机场三字码，如 PEK */
  departureAirport: string;
  /** 到达机场三字码，如 SHA */
  arrivalAirport: string;
  /** 出发时间戳（毫秒） */
  departureTime: number;
  /** 到达时间戳（毫秒） */
  arrivalTime: number;
  /** 起售价（单位：分） */
  price: number;
}

/** 航班列表查询参数 */
export interface FlightListParams {
  /** 出发城市码 */
  departureCity: string;
  /** 到达城市码 */
  arrivalCity: string;
  /** 出发日期（YYYY-MM-DD） */
  departureDate: string;
  sortBy: FlightSortBy;
}

/** 航班列表查询结果 */
export interface FlightListResult {
  list: Flight[];
  total: number;
}

/** 舱位报价 */
export interface FareOption {
  fareId: string;
  cabinClass: CabinClass;
  /** 该舱位售价（单位：分） */
  price: number;
  seatsLeft: number;
  refundPolicy: string;
}

/** 航班详情 */
export interface FlightDetail {
  flightNo: string;
  airline: string;
  /** 出发机场三字码 */
  departureAirport: string;
  /** 到达机场三字码 */
  arrivalAirport: string;
  /** 出发时间戳（毫秒） */
  departureTime: number;
  /** 到达时间戳（毫秒） */
  arrivalTime: number;
  /** 机型，如 Boeing 737 */
  aircraftModel: string;
  fares: FareOption[];
}

/** 乘机人信息 */
export interface Passenger {
  fullName: string;
  idNumber: string;
}

/** 机票预订入参 */
export interface BookFlightPayload {
  flightNo: string;
  /** 选中的舱位报价 ID */
  fareId: string;
  passengers: Passenger[];
}

/** 机票预订结果 */
export interface BookFlightResult {
  orderId: string;
}

const FLIGHT_SERVICE_CODE = '33251';

// 查询用 GET（params 走 query）、变更用 POST（data 走 body），共用一个 serviceCode
const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

/** 查询航班列表：开启去重（快速改筛选条件时取消上一次请求）并对瞬时故障重试 */
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/api/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

/** 查询航班详情 */
export const fetchFlightDetail = (flightNo: string) =>
  get<FlightDetail>({ url: '/api/flight/detail', params: { flightNo } });

/** 静默查询航班详情（不显示错误提示） */
export const fetchFlightDetailSilent = (flightNo: string) =>
  get<FlightDetail>({
    url: '/api/flight/detail',
    params: { flightNo },
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });

/** 查询航班详情（自定义错误提示） */
export const fetchFlightDetailWithCustomError = (flightNo: string) =>
  get<FlightDetail>({
    url: '/api/flight/detail',
    params: { flightNo },
    businessError: { customMessage: '获取航班信息失败，请稍后重试' },
  });

/** 预订机票：变更类请求不重试、不去重，避免重复下单 */
export const bookFlight = (payload: BookFlightPayload) =>
  post<BookFlightResult>({ url: '/api/flight/book', data: payload });

/**
 * 预订机票（业务自行处理错误的示例）。
 * 关掉默认提示并抛出 RequestError，调用方按错误类型 / 业务码自定义处理（如余票不足、重复下单）：
 *
 *   try {
 *     const result = await bookFlightOrThrow(payload);
 *   } catch (error) {
 *     if (error instanceof RequestError && error.type === RequestErrorType.Business) {
 *       // 按 error.code 分别处理
 *     }
 *   }
 */
export const bookFlightOrThrow = (payload: BookFlightPayload) =>
  post<BookFlightResult>({
    url: '/api/flight/book',
    data: payload,
    isErrorSwallowed: false,
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });
