import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../types/interceptors';
import { RequestStatus, reportAnalytics } from '../utils/analytics-reporter';
import { RequestError, RequestErrorType } from '../utils/error';
import { generateRequestId } from '../utils/request-id';

// axios 把 params / data 声明为 any，在入口收窄为 unknown，上报载荷不再沾染 any
interface TraceSource extends Pick<AxiosRequestConfig, '__requestId' | 'method' | 'url'> {
  params?: unknown;
  data?: unknown;
}

// 开始时间只在这一对拦截器之间用。挂在 config 上会和请求标识并列。键是当次 config，请求结束即可回收
const startTimeMsByConfig = new WeakMap<TraceSource, number>();

// 缺少 requestId 或开始时间时返回 null，调用方据此跳过上报
const extractTrace = (config?: TraceSource) => {
  if (config == null) {
    return null;
  }

  const { __requestId: requestId, method = '', url = '', params, data } = config;
  const startTimeMs = startTimeMsByConfig.get(config);

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
    startTimeMsByConfig.set(config, Date.now());

    return config;
  },
};

export const analyticsResInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse<unknown>) => {
    const { config, data } = response;
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
