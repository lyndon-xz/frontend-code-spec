import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../types/interceptor';
import { RequestStatus, reportAnalytics } from '../utils/analytics-reporter';
import { RequestError, RequestErrorType } from '../utils/error';
import { generateRequestId } from '../utils/trace';

// 缺少 requestId / startTimeMs 时返回 null，调用方据此跳过上报
const extractTrace = (config?: AxiosRequestConfig) => {
  const {
    __requestId: requestId,
    __requestStartTimeMs: startTimeMs,
    url = '',
    method = '',
    params,
    data,
  } = config ?? {};

  if (typeof requestId !== 'string' || startTimeMs === undefined) {
    return null;
  }

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
    // 沿用 request 层在循环外生成的 id，重试与首次尝试串在同一链路
    config.__requestId ??= generateRequestId(config);
    // 每次尝试独立刷新，统计单次耗时
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
        status: RequestStatus.Error,
        responseData: null,
        errorMessage,
        endTimeMs: Date.now(),
      });
    }

    return Promise.reject(error);
  },
};
