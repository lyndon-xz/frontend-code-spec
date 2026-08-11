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

/** 生产环境上报实现，默认空实现，业务侧通过 setAnalyticsSender 接入 */
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

/**
 * 埋点上报出口。上报数据含完整请求参数与响应体，其中可能有身份证号、手机号这类个人标识，
 * 接入真实上报实现时须先按业务的敏感字段清单脱敏；本层只保证「生产不打控制台」这一条。
 */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  activeAnalyticsSender(analyticsData);
};
