import type { Method } from 'axios';

import { analyticsReqInterceptor, analyticsResInterceptor } from './interceptors/analytics';
import { authReqInterceptor } from './interceptors/auth';
import { businessErrorInterceptor } from './interceptors/error/business';
import { networkErrorInterceptor } from './interceptors/error/network';
import { ssoInterceptor } from './interceptors/sso';
import type { ReqInterceptor, ResInterceptor } from './types/interceptors';
import type { RequestCapability } from './types/request/options';
import { generateRequestId } from './utils/request-id';

export const createCapabilitySet = (capabilities: readonly RequestCapability[]) =>
  new Set(capabilities);

export const requestInterceptors = (
  capabilities: readonly RequestCapability[],
): ReqInterceptor[] => {
  const enabled = createCapabilitySet(capabilities);
  const interceptors: ReqInterceptor[] = [];

  if (enabled.has('analytics')) {
    interceptors.push(analyticsReqInterceptor);
  }
  if (enabled.has('auth')) {
    interceptors.push(authReqInterceptor);
  }

  return interceptors;
};

/** 响应顺序不可调：网络错误、登录态、业务码、上报。未列入的从这条顺序里拿掉 */
export const responseInterceptors = (
  capabilities: readonly RequestCapability[],
): ResInterceptor[] => {
  const enabled = createCapabilitySet(capabilities);
  const interceptors: ResInterceptor[] = [];

  if (enabled.has('networkError')) {
    interceptors.push(networkErrorInterceptor);
  }
  if (enabled.has('sso')) {
    interceptors.push(ssoInterceptor);
  }
  if (enabled.has('businessError')) {
    interceptors.push(businessErrorInterceptor);
  }
  if (enabled.has('analytics')) {
    interceptors.push(analyticsResInterceptor);
  }

  return interceptors;
};

/** 缓存键按能力名排序，传入数组的先后不换实例。拦截器执行顺序在上面两个挑选函数里写死 */
export const capabilityCacheKey = (
  serviceCode: string,
  capabilities: readonly RequestCapability[],
) => `${serviceCode}\0${[...createCapabilitySet(capabilities)].sort().join(',')}`;

export const requestIdFor = (
  enabled: ReadonlySet<RequestCapability>,
  method: Method,
  url: string,
) => {
  if (!enabled.has('analytics') && !enabled.has('retry')) {
    return undefined;
  }

  return generateRequestId(method, url);
};
