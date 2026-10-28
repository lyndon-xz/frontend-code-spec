import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

export enum RequestStatus {
  Success = 'success',
  Error = 'error',
}

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

/** 上报前的脱敏钩子，拿到的是完整载荷，返回处理后的载荷 */
export type AnalyticsSanitizer = (analyticsData: AnalyticsData) => AnalyticsData;

const noopSender: AnalyticsSender = () => undefined;

/*
 * 默认不脱敏，但把钩子摆在这里而不是只在注释里写「接入前须脱敏」：
 * 上报载荷含完整 params / data / responseData，业务侧接入真实 sender 前必须在此摘掉敏感字段。
 */
const passthroughSanitizer: AnalyticsSanitizer = (analyticsData) => analyticsData;

// 观察通道走 warn：log 会被构建剥离，warn 是本仓放行的告警出口
const logToConsole = (analyticsData: AnalyticsData) => {
  const {
    requestId,
    method,
    url,
    requestParams,
    responseData,
    status,
    errorMessage,
    startTimeMs,
    endTimeMs,
  } = analyticsData;

  console.warn(`[埋点上报] ${method} ${url}`, {
    请求ID: requestId,
    请求时间: new Date(startTimeMs).toLocaleString('zh-CN'),
    请求耗时: `${endTimeMs - startTimeMs}ms`,
    请求状态: status,
    请求参数: requestParams,
    ...(status === RequestStatus.Success ? { 返回数据: responseData } : { 错误信息: errorMessage }),
  });
};

let sendAnalytics: AnalyticsSender = noopSender;
let sanitizeAnalytics: AnalyticsSanitizer = passthroughSanitizer;

export const setAnalyticsSender = (sender: AnalyticsSender) => {
  sendAnalytics = sender;
};

export const resetAnalyticsSender = () => {
  sendAnalytics = noopSender;
};

export const setAnalyticsSanitizer = (sanitizer: AnalyticsSanitizer) => {
  sanitizeAnalytics = sanitizer;
};

export const resetAnalyticsSanitizer = () => {
  sanitizeAnalytics = passthroughSanitizer;
};

/** 开发环境只打控制台（不脱敏，便于排查）；生产走脱敏后再交给注入的 sender */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  sendAnalytics(sanitizeAnalytics(analyticsData));
};
