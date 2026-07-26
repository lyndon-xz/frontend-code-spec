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

export enum RequestStatus {
  Success = 'success',
  Error = 'error',
}

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

// 生产环境上报出口占位：接入真实埋点 SDK（如 sendBeacon / 上报接口）时替换此处
const sendToServer = (analyticsData: AnalyticsData) => {
  void analyticsData;
};

/**
 * 埋点上报出口。开发环境打印分组日志便于调试，生产环境走真实上报，
 * 避免生产控制台刷屏与请求数据泄漏。接入真实 SDK 时只需改 sendToServer，拦截器无需改动。
 */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  sendToServer(analyticsData);
};
