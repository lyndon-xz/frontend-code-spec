import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

export interface AnalyticsData {
  requestId: string;
  method: string;
  url: string;
  requestParams: unknown;
  responseData: unknown;
  status: RequestStatus;
  errorMessage?: string;
  startTimeMs: number;
  endTimeMs: number;
}

export type AnalyticsSender = (analyticsData: AnalyticsData) => void;

export enum RequestStatus {
  Success = 'success',
  Error = 'error',
}

const noopSender: AnalyticsSender = () => {};

let activeAnalyticsSender: AnalyticsSender = noopSender;

/* eslint-disable no-console -- 开发环境的埋点观察通道，控制台输出即本函数的全部职责 */
const logToConsole = (analyticsData: AnalyticsData) => {
  const {
    method,
    url,
    requestId,
    startTimeMs,
    endTimeMs,
    status,
    requestParams,
    responseData,
    errorMessage,
  } = analyticsData;
  const duration = endTimeMs - startTimeMs;

  console.group(`[埋点上报] ${method} ${url}`);
  console.log('请求ID:', requestId);
  console.log('请求时间:', new Date(startTimeMs).toLocaleString());
  console.log('请求耗时:', `${duration}ms`);
  console.log('请求状态:', status);
  console.log('请求参数:', requestParams);

  if (status === RequestStatus.Success) {
    console.log('返回数据:', responseData);
  } else {
    console.log('错误信息:', errorMessage);
  }

  console.groupEnd();
};
/* eslint-enable no-console */

export const setAnalyticsSender = (sender: AnalyticsSender) => {
  activeAnalyticsSender = sender;
};

export const resetAnalyticsSender = () => {
  activeAnalyticsSender = noopSender;
};

/** 上报数据含完整请求参数与响应体，接入真实实现前须脱敏 */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  activeAnalyticsSender(analyticsData);
};
