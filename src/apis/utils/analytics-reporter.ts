import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';
import { createSwappable } from '@/utils/swappable';

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

const noopSender: AnalyticsSender = () => {};

/*
 * 默认不脱敏，但把钩子摆在这里而不是只在注释里写「接入前须脱敏」：
 * 上报载荷含完整 params / data / responseData，业务侧接入真实 sender 前必须在此摘掉敏感字段。
 */
const passthroughSanitizer: AnalyticsSanitizer = (analyticsData) => analyticsData;

/* eslint-disable no-console -- 开发环境的埋点观察通道，控制台输出即本函数的全部职责 */
const logToConsole = (analyticsData: AnalyticsData) => {
  // 解构序对齐 AnalyticsData 的声明顺序；下面的打印顺序另按可读性排，不受此约束
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

const analyticsSenderSlot = createSwappable(noopSender);
const analyticsSanitizerSlot = createSwappable(passthroughSanitizer);

export const setAnalyticsSender = analyticsSenderSlot.set;

export const resetAnalyticsSender = analyticsSenderSlot.reset;

export const setAnalyticsSanitizer = analyticsSanitizerSlot.set;

export const resetAnalyticsSanitizer = analyticsSanitizerSlot.reset;

/** 开发环境只打控制台（不脱敏，便于排查）；生产走脱敏后再交给注入的 sender */
export const reportAnalytics = (analyticsData: AnalyticsData) => {
  if (getEnvironment() === Environment.Development) {
    logToConsole(analyticsData);
    return;
  }

  analyticsSenderSlot.get()(analyticsSanitizerSlot.get()(analyticsData));
};
