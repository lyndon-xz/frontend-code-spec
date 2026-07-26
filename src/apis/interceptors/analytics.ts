import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../types/interceptor';
import { RequestStatus, reportAnalytics } from '../utils/analytics-reporter';
import { RequestError, RequestErrorType } from '../utils/error';

const generateRequestId = (config: InternalAxiosRequestConfig): string => {
  const uniqueId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${config.method?.toUpperCase()}_${config.url}_${uniqueId}`;
};

/*
 * 从 config 提取埋点公共字段。若缺少 requestId/startTime（未经埋点请求拦截器的请求），
 * 返回 null，调用方据此跳过上报。
 */
const extractTrace = (config?: AxiosRequestConfig) => {
  const {
    __requestId: requestId,
    __requestStartTime: startTime,
    url = '',
    method = '',
    params,
    data,
  } = config ?? {};

  if (typeof requestId !== 'string' || startTime === undefined) return null;

  return {
    requestId,
    startTime,
    url,
    method: method.toUpperCase(),
    requestParams: { params, data },
  };
};

export const analyticsReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    config.__requestId = generateRequestId(config);
    config.__requestStartTime = Date.now();

    return config;
  },
};

export const analyticsResInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const trace = extractTrace(response?.config);
    if (trace) {
      reportAnalytics({
        ...trace,
        status: RequestStatus.Success,
        responseData: response.data,
        endTime: Date.now(),
      });
    }

    return response;
  },

  onRejected: async (error: unknown) => {
    // 经过 network 拦截器归一后，到这里的错误必然是 RequestError（自带 config）
    if (!(error instanceof RequestError)) return Promise.reject(error);

    const { type, config, message: rawMessage } = error;
    const trace = extractTrace(config);

    if (trace && type !== RequestErrorType.Canceled) {
      const errorMessage = rawMessage.length > 0 ? rawMessage : '未知错误';

      reportAnalytics({
        ...trace,
        status: RequestStatus.Error,
        responseData: null,
        errorMessage,
        endTime: Date.now(),
      });
    }

    return Promise.reject(error);
  },
};
