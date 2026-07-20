import { createPostRequest } from '../request';

/** 航班排序方式 */
export type FlightSortBy = 'price-asc' | 'price-desc' | 'departure-time' | 'duration';

/** 舱位等级 */
export type CabinClass = 'economy' | 'business' | 'first';

/** 航班列表项 */
export interface Flight {
  /** 航班号，如 CA1234 */
  flightNo: string;
  /** 航空公司名称 */
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
  /** 排序方式 */
  sortBy: FlightSortBy;
}

/** 航班列表查询结果 */
export interface FlightListResult {
  /** 航班列表 */
  list: Flight[];
  /** 总条数 */
  total: number;
}

/** 舱位报价 */
export interface FareOption {
  /** 报价 ID */
  fareId: string;
  /** 舱位等级 */
  cabinClass: CabinClass;
  /** 该舱位售价（单位：分） */
  price: number;
  /** 剩余座位数 */
  seatsLeft: number;
  /** 退改签说明 */
  refundPolicy: string;
}

/** 航班详情 */
export interface FlightDetail {
  /** 航班号 */
  flightNo: string;
  /** 航空公司名称 */
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
  /** 可选舱位报价 */
  fares: FareOption[];
}

/** 乘机人信息 */
export interface Passenger {
  /** 乘机人姓名 */
  fullName: string;
  /** 证件号 */
  idNumber: string;
}

/** 机票预订入参 */
export interface BookFlightPayload {
  /** 航班号 */
  flightNo: string;
  /** 选中的舱位报价 ID */
  fareId: string;
  /** 乘机人列表 */
  passengers: Passenger[];
}

/** 机票预订结果 */
export interface BookFlightResult {
  /** 订单号 */
  orderId: string;
}

const FLIGHT_SERVICE_CODE = '33251';

// 机票统一请求实例：搜索、详情、预订共用一个 serviceCode
const request = createPostRequest(FLIGHT_SERVICE_CODE);

/** 查询航班列表 */
export const fetchFlights = (query: FlightListParams) =>
  request<FlightListResult>({ url: '/api/flight/list', params: query });

/** 查询航班详情 */
export const fetchFlightDetail = (flightNo: string) =>
  request<FlightDetail>({ url: '/api/flight/detail', params: { flightNo } });

/** 静默查询航班详情（不显示错误提示） */
export const fetchFlightDetailSilent = (flightNo: string) =>
  request<FlightDetail>({
    url: '/api/flight/detail',
    params: { flightNo },
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });

/** 查询航班详情（自定义错误提示） */
export const fetchFlightDetailWithCustomError = (flightNo: string) =>
  request<FlightDetail>({
    url: '/api/flight/detail',
    params: { flightNo },
    businessError: { customMessage: '获取航班信息失败，请稍后重试' },
  });

/** 预订机票 */
export const bookFlight = (payload: BookFlightPayload) =>
  request<BookFlightResult>({ url: '/api/flight/book', params: payload });
