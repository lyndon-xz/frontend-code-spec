import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

export interface AnalyticsData {
  requestId: string;
  method: string;
  url: string;
  requestParams: unknown;
  responseData: unknown;
  status: RequestStatus;
  /** 错误信息，仅在失败时有值 */
  errorMessage?: string;
  startTime: number;
  endTime: number;
}

/** 生产环境埋点上报实现；默认空实现，业务侧通过 setAnalyticsSender 接入 */
export type AnalyticsSender = (analyticsData: AnalyticsData) => void;

export enum RequestStatus {
  Success = 'success',
  Error = 'error',
}

const noopSender: AnalyticsSender = (analyticsData) => {
  void analyticsData;
};

let analyticsSender: AnalyticsSender = noopSender;

// 开发环境用分组日志便于调试
const logToConsole = (analyticsData: AnalyticsData) => {
  const {
    method,
    url,
    requestId,
    startTime,
    endTime,
    status,
    requestParams,
    responseData,
    errorMessage,
  } = analyticsData;
  const duration = endTime - startTime;

  console.group(`[埋点上报] ${method} ${url}`);
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

  console.groupEnd();
};

/** 替换生产环境埋点上报实现 */
export const setAnalyticsSender = (sender: AnalyticsSender) => {
  analyticsSender = sender;
};

/** 恢复为默认空实现 */
export const resetAnalyticsSender = () => {
  analyticsSender = noopSender;
};

/**
 * 埋点上报出口。开发环境打印分组日志便于调试，生产环境走可注入的上报实现，
 * 避免生产控制台刷屏与请求数据泄漏。
 */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  analyticsSender(analyticsData);
};
