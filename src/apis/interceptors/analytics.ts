import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../types/interceptor';
import { RequestStatus, reportAnalytics } from '../utils/analytics-reporter';
import { RequestError, RequestErrorType } from '../utils/error';
import { generateRequestId } from '../utils/trace';

/*
 * 从 config 提取埋点公共字段。若缺少 requestId/startTimeMs（未经埋点请求拦截器的请求），
 * 返回 null，调用方据此跳过上报。
 */
const extractTrace = (config?: AxiosRequestConfig) => {
  const {
    __requestId: requestId,
    __requestStartTimeMs: startTimeMs,
    url = '',
    method = '',
    params,
    data,
  } = config ?? {};

  if (typeof requestId !== 'string' || startTimeMs === undefined) return null;

  return {
    requestId,
    startTimeMs,
    url,
    method: method.toUpperCase(),
    requestParams: { params, data },
  };
};

export const analyticsReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // request 层已在重试循环外生成 id 的情况下沿用，重试才能与首次尝试串在同一条链路上
    config.__requestId ??= generateRequestId(config);
    // startTimeMs 每次尝试独立刷新，耗时统计的是单次尝试而非含重试的总时长
    config.__requestStartTimeMs = Date.now();

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
        endTimeMs: Date.now(),
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
        endTimeMs: Date.now(),
      });
    }

    return Promise.reject(error);
  },
};
