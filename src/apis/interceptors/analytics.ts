import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../types/interceptors';
import { RequestStatus, reportAnalytics } from '../utils/analytics-reporter';
import { RequestError, RequestErrorType } from '../utils/error';
import { generateRequestId } from '../utils/trace';

// 缺少 requestId / startTimeMs 时返回 null，调用方据此跳过上报
const extractTrace = (config?: AxiosRequestConfig) => {
  const {
    __requestId: requestId,
    __requestStartTimeMs: startTimeMs,
    method = '',
    url = '',
    params,
    data,
  } = config ?? {};

  if (typeof requestId !== 'string' || startTimeMs === undefined) {
    return null;
  }

  // 字段序对齐 AnalyticsData 的声明顺序，两处才能对着读、漏一项一眼看得出
  return {
    requestId,
    method: method.toUpperCase(),
    url,
    requestParams: { params, data },
    startTimeMs,
  };
};

export const analyticsReqInterceptor: ReqInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    // 沿用 request 层在循环外生成的 id，重试与首次尝试串在同一链路
    config.__requestId ??= generateRequestId(config.method ?? 'GET', config.url);
    // 每次尝试独立刷新，统计单次耗时
    config.__requestStartTimeMs = Date.now();

    return config;
  },
};

export const analyticsResInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const { config, data } = response ?? {};
    const trace = extractTrace(config);

    if (trace) {
      reportAnalytics({
        ...trace,
        responseData: data,
        status: RequestStatus.Success,
        endTimeMs: Date.now(),
      });
    }

    return response;
  },

  onRejected: async (error: unknown) => {
    // network 拦截器已把错误归一为 RequestError，它自带 config
    if (!(error instanceof RequestError)) {
      return Promise.reject(error);
    }

    const { type, config, message: rawMessage } = error;
    const trace = extractTrace(config);

    if (trace && type !== RequestErrorType.Canceled) {
      const errorMessage = rawMessage.length > 0 ? rawMessage : '未知错误';

      reportAnalytics({
        ...trace,
        responseData: null,
        status: RequestStatus.Error,
        errorMessage,
        endTimeMs: Date.now(),
      });
    }

    return Promise.reject(error);
  },
};
