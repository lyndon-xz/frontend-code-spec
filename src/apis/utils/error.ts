import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

interface RequestErrorMeta {
  // 仅 http / unauthorized 类错误有值
  status?: number;
  // 仅 business 类错误有值
  code?: number;
  // 下游靠它抑制重试期间的重复提示、串联埋点，各归一分支都应带上
  config?: AxiosRequestConfig;
  // 仅 unknown 类错误有值，保留现场便于定位真正的异常来源
  cause?: unknown;
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
  /** 非请求链路的未知异常（如拦截器内部报错），不代表网络或服务端故障 */
  Unknown = 'unknown',
}

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
// 未映射的 4xx：请求已到达服务端，与网络无关，故用不归因的中性文案
const DEFAULT_REQUEST_MESSAGE = '请求失败，请稍后重试';
const DEFAULT_UNKNOWN_MESSAGE = '请求出现异常，请稍后重试';

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
    const { status, code, config, cause } = meta;
    super(message, { cause });
    this.name = 'RequestError';
    this.type = type;
    this.status = status;
    this.code = code;
    this.config = config;
  }
}

/**
 * 把 axios / 取消 / 未知错误归一成带类型与提示文案的 RequestError。
 * 所有 axios 错误分支都必须带上 config：下游靠它读取 __retriesLeft 抑制重试期间的重复提示、读取 __requestId 串联埋点。
 */
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
        (isServerError ? DEFAULT_SERVER_MESSAGE : DEFAULT_REQUEST_MESSAGE);
      const type = status === 401 ? RequestErrorType.Unauthorized : RequestErrorType.Http;
      return new RequestError(type, message, { status, config });
    }

    // 无 response：请求没能到达服务端，属网络不可达
    return new RequestError(RequestErrorType.Network, DEFAULT_NETWORK_MESSAGE, { config });
  }

  // 非 axios 错误只可能来自链路内部（拦截器抛错等），归到 Network 会把代码 bug 伪装成网络问题
  return new RequestError(RequestErrorType.Unknown, DEFAULT_UNKNOWN_MESSAGE, { cause: error });
};

/** 是否为可重试错误：网络不可达、超时、5xx 视为瞬时故障可重试；4xx、业务错误与未知异常不重试 */
export const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof RequestError)) return false;

  const { type, status } = error;
  if (type === RequestErrorType.Network || type === RequestErrorType.Timeout) return true;
  return type === RequestErrorType.Http && status !== undefined && status >= 500;
};
