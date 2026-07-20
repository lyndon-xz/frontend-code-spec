import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import type { ReqInterceptor, ResInterceptor } from '../../types/interceptor';
import { isAxiosLikeError, isEnhancedConfig } from '../../utils/guards';

export interface AnalyticsData {
  /** 请求唯一标识 */
  requestId: string;
  /** HTTP 方法 */
  method: string;
  /** 请求 URL */
  url: string;
  /** 请求参数 */
  requestParams: unknown;
  /** 响应数据 */
  responseData: unknown;
  /** 请求状态 */
  status: RequestStatus;
  /** 错误信息（仅在失败时有值） */
  errorMessage?: string;
  /** 请求开始时间戳 */
  startTime: number;
  /** 请求结束时间戳 */
  endTime: number;
}

export enum RequestStatus {
  Success = 'success',
  Error = 'error',
}

const generateRequestId = (config: InternalAxiosRequestConfig): string => {
  return `${config.method?.toUpperCase()}_${config.url}_${Date.now()}_${Math.random()}`;
};

const reportAnalytics = (analyticsPayload: AnalyticsData) => {
  const { method, url, requestId, startTime, endTime, status, requestParams, responseData, errorMessage } =
    analyticsPayload;
  const duration = endTime - startTime;

  console.group(`📊 [埋点上报] ${method} ${url}`);
  console.log('请求ID:', requestId);
  console.log('请求时间:', new Date(startTime).toLocaleString());
  console.log('请求耗时:', `${duration}ms`);
  console.log('请求状态:', status);
  console.log('请求参数:', requestParams);

  if (status === RequestStatus.Success) {
    console.log('返回数据:', responseData);
  } else {
    console.log('错误信息:', errorMessage);
  }

  console.log('完整埋点数据:', analyticsPayload);
  console.groupEnd();
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
    const { config, data: responseData } = response ?? {};
    if (!isEnhancedConfig(config)) return response;

    const {
      __requestId: requestId,
      __requestStartTime: startTime,
      url = '',
      method = '',
      params,
      data: requestData,
    } = config;

    if (startTime !== undefined && typeof requestId === 'string') {
      reportAnalytics({
        requestId,
        url,
        method: method.toUpperCase(),
        requestParams: { params, data: requestData },
        responseData,
        status: RequestStatus.Success,
        startTime,
        endTime: Date.now(),
      });
    }

    return response;
  },

  onRejected: async (error: unknown) => {
    if (!isAxiosLikeError(error)) return Promise.reject(error);

    const { config, message } = error;
    const {
      __requestId: requestId,
      __requestStartTime: startTime,
      url = '',
      method = '',
      params,
      data: requestData,
    } = config ?? {};

    if (startTime !== undefined && typeof requestId === 'string') {
      const errorMessage = typeof message === 'string' && message.length > 0 ? message : '未知错误';

      reportAnalytics({
        requestId,
        url,
        method: method.toUpperCase(),
        requestParams: { params, data: requestData },
        responseData: null,
        status: RequestStatus.Error,
        errorMessage,
        startTime,
        endTime: Date.now(),
      });
    }

    return Promise.reject(error);
  },
};
