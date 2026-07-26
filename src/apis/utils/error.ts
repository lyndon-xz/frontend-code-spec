import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

// RequestError 构造附带信息（避免使用 options 这类泛化命名）
interface RequestErrorMeta {
  // HTTP 状态码（http / unauthorized 类错误）
  status?: number;
  // 业务码（business 类错误）
  code?: number;
  // 触发错误的请求配置，供埋点与重试判断使用
  config?: AxiosRequestConfig;
}

/** 请求错误类型，供调用方按类型区分处理 */
export enum RequestErrorType {
  /** 网络不可达 */
  Network = 'network',
  /** 请求超时 */
  Timeout = 'timeout',
  /** HTTP 状态码错误（4xx / 5xx） */
  Http = 'http',
  /** 业务码错误（HTTP 2xx 但 code !== 0） */
  Business = 'business',
  /** 未登录 / 无权限 */
  Unauthorized = 'unauthorized',
  /** 请求被主动取消 */
  Canceled = 'canceled',
}

// HTTP 状态码 → 用户提示文案
const HTTP_STATUS_MESSAGE: Record<number, string> = {
  400: '请求参数有误',
  401: '登录已失效，请重新登录',
  403: '没有访问权限',
  404: '请求的资源不存在',
  500: '服务器开小差了，请稍后重试',
  502: '网关异常，请稍后重试',
  503: '服务暂不可用，请稍后重试',
  504: '网关超时，请稍后重试',
};

const DEFAULT_NETWORK_MESSAGE = '网络连接失败，请检查网络后重试';
const DEFAULT_TIMEOUT_MESSAGE = '请求超时，请稍后重试';
const DEFAULT_SERVER_MESSAGE = '服务器开小差了，请稍后重试';

/**
 * 统一的请求错误。各拦截器主动抛错时都用它携带 config，
 * 既保证 analytics 拦截器能通过 config 上报，也让 isErrorSwallowed:false 的调用方拿到结构化错误。
 */
export class RequestError extends Error {
  public readonly type: RequestErrorType;
  public readonly status?: number;
  public readonly code?: number;
  public readonly config?: AxiosRequestConfig;

  constructor(type: RequestErrorType, message: string, meta: RequestErrorMeta = {}) {
    super(message);
    const { status, code, config } = meta;
    this.name = 'RequestError';
    this.type = type;
    this.status = status;
    this.code = code;
    this.config = config;
  }
}

/** 把 axios / 取消 / 未知错误归一成带类型与提示文案的 RequestError */
export const classifyAxiosError = (error: unknown): RequestError => {
  if (error instanceof RequestError) return error;

  if (axios.isCancel(error)) {
    const config = axios.isAxiosError(error) ? error.config : undefined;
    return new RequestError(RequestErrorType.Canceled, '请求已取消', { config });
  }

  if (axios.isAxiosError(error)) {
    const { code, response, config } = error;

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return new RequestError(RequestErrorType.Timeout, DEFAULT_TIMEOUT_MESSAGE, { config });
    }

    if (response) {
      const { status } = response;
      const isServerError = status >= 500;
      const message =
        HTTP_STATUS_MESSAGE[status] ??
        (isServerError ? DEFAULT_SERVER_MESSAGE : DEFAULT_NETWORK_MESSAGE);
      const type = status === 401 ? RequestErrorType.Unauthorized : RequestErrorType.Http;
      return new RequestError(type, message, { status, config });
    }
  }

  return new RequestError(RequestErrorType.Network, DEFAULT_NETWORK_MESSAGE);
};

/** 是否为可重试错误：网络不可达、超时、5xx 视为瞬时故障可重试；4xx 与业务错误不重试 */
export const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof RequestError)) return false;

  const { type, status } = error;
  if (type === RequestErrorType.Network || type === RequestErrorType.Timeout) return true;
  return type === RequestErrorType.Http && status !== undefined && status >= 500;
};
