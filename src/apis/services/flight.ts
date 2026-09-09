import { createGetRequest, createPostRequest } from '../request';
import type { EnhancedRequestConfig } from '../types/config';

/**
 * 排序取值的唯一来源：数组给运行时遍历（渲染排序选项、校验 URL 参数），类型由它派生。
 * 反过来手写联合类型的话，想遍历就得再抄一份数组，两份从此各自演进。
 */
export const FLIGHT_SORT_BY_VALUES = [
  'price-asc',
  'price-desc',
  'departure-time',
  'duration',
] as const;

export type FlightSortBy = (typeof FLIGHT_SORT_BY_VALUES)[number];

export interface FlightListParams {
  departureCity: string;
  arrivalCity: string;
  /** 格式 YYYY-MM-DD */
  departureDate: string;
  sortBy: FlightSortBy;
}

/** 航段基座：列表项与详情共有的班次信息，两处从它派生而不各写一遍 */
export interface FlightSegment {
  flightNo: string;
  airline: string;
  /** 机场三字码，如 PEK */
  departureAirport: string;
  arrivalAirport: string;
  departureTimeMs: number;
  arrivalTimeMs: number;
}

export interface Flight extends FlightSegment {
  /** 该航班的最低舱位价 */
  priceCents: number;
}

export interface FlightListResult {
  list: Flight[];
  total: number;
}

/** 舱位等级由服务端契约定义，故用 enum 让成员名与契约值解耦 */
export enum CabinClass {
  Economy = 'economy',
  Business = 'business',
  First = 'first',
}

export interface FareOption {
  fareId: string;
  cabinClass: CabinClass;
  priceCents: number;
  seatsLeft: number;
  refundPolicy: string;
}

export interface FlightDetail extends FlightSegment {
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

const FLIGHT_LIST_URL = '/flight/list';
const FLIGHT_DETAIL_URL = '/flight/detail';
const FLIGHT_BOOK_URL = '/flight/book';

const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

/** 错误处置策略由调用方按场景选，默认走「提示 + 吞错返回 null」 */
export type ErrorHandling = Pick<
  EnhancedRequestConfig,
  'businessError' | 'networkError' | 'isErrorSwallowed'
>;

/** 去重签名含 params，只挡同一筛选条件的连续触发 */
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: FLIGHT_LIST_URL,
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

export const fetchFlightDetail = (flightNo: string, errorHandling?: ErrorHandling) =>
  get<FlightDetail>({ url: FLIGHT_DETAIL_URL, params: { flightNo }, ...errorHandling });

/** 变更类请求不重试、不去重 */
export const bookFlight = (payload: BookFlightPayload, errorHandling?: ErrorHandling) =>
  post<BookFlightResult>({ url: FLIGHT_BOOK_URL, data: payload, ...errorHandling });

/** 全静默：不弹提示，由调用方读返回值自行判断 */
export const SILENT_ERROR_HANDLING: ErrorHandling = {
  businessError: { isSilent: true },
  networkError: { isSilent: true },
};

/** 关掉吞错与提示，把错误抛给调用方自己接 */
export const THROWN_ERROR_HANDLING: ErrorHandling = {
  ...SILENT_ERROR_HANDLING,
  isErrorSwallowed: false,
};
