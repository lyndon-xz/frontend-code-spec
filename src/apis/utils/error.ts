import axios, { type AxiosRequestConfig } from 'axios';

interface RequestErrorMeta {
  status?: number;
  code?: number;
  config?: AxiosRequestConfig;
  cause?: unknown;
}

export enum RequestErrorType {
  Network = 'network',
  Timeout = 'timeout',
  Http = 'http',
  Business = 'business',
  Unauthorized = 'unauthorized',
  Canceled = 'canceled',
  /** 非请求链路的异常，不代表网络或服务端故障 */
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

/** 退避等待期间的取消也复用此文案 */
export const CANCELED_MESSAGE = '请求已取消';

const DEFAULT_NETWORK_MESSAGE = '网络连接失败，请检查网络后重试';
const DEFAULT_TIMEOUT_MESSAGE = '请求超时，请稍后重试';
const DEFAULT_SERVER_MESSAGE = '服务器开小差了，请稍后重试';
const DEFAULT_REQUEST_MESSAGE = '请求失败，请稍后重试';
const DEFAULT_UNKNOWN_MESSAGE = '请求出现异常，请稍后重试';

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

/** 归一成带类型与提示文案的 RequestError */
export const classifyAxiosError = (error: unknown): RequestError => {
  if (error instanceof RequestError) return error;

  if (axios.isCancel(error)) {
    const config = axios.isAxiosError(error) ? error.config : undefined;
    return new RequestError(RequestErrorType.Canceled, CANCELED_MESSAGE, { config });
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

    // 无 response 说明请求没到达服务端
    return new RequestError(RequestErrorType.Network, DEFAULT_NETWORK_MESSAGE, { config });
  }

  // 非 axios 错误归到 Unknown，不把代码 bug 伪装成网络问题
  return new RequestError(RequestErrorType.Unknown, DEFAULT_UNKNOWN_MESSAGE, { cause: error });
};

/** 网络不可达、超时、5xx 算瞬时故障可重试；4xx 与业务错误不重试 */
export const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof RequestError)) return false;

  const { type, status } = error;
  if (type === RequestErrorType.Network || type === RequestErrorType.Timeout) return true;
  return type === RequestErrorType.Http && status !== undefined && status >= 500;
};
