import type { AxiosResponse } from 'axios';

import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

import { UNAUTHORIZED_CODE } from '../constants/codes';
import type { ResInterceptor } from '../types/interceptors';
import type { SsoResponse } from '../types/responses';
import { hasNumberField } from '../utils/envelope';
import { RequestError, RequestErrorType } from '../utils/error';

// 多个请求同时未授权时只触发一次跳转
let isRedirecting = false;

/*
 * a.click() 触发的导航被宿主拦截时不会抛错，所以这个 latch 必须能自己解开：
 * 否则一次失败的跳转会永久关闭跳转通道，页面停在原地且没有任何出口。
 */
const REDIRECT_LATCH_TIMEOUT_MS = 5000;

/*
 * 同时带 code 的响应体归业务信封处理：本拦截器排在业务拦截器之前，
 * 不排除的话，一个带 returncode 字段的业务响应会被 SSO 抢先接管。
 */
const isSsoResponse = (body: unknown): body is SsoResponse =>
  hasNumberField(body, 'returncode') && !hasNumberField(body, 'code');

/*
 * 拦掉 javascript: / data: 等危险协议。生产只放行 https：明文跳转会把回跳地址与登录态暴露在链路上，
 * 而本地联调常用 http 起 SSO 桩，故仅开发环境放行 http。
 * 不限域是有意的——SSO 通常就在另一个域，域白名单需要业务侧提供清单，由 setSsoRedirectValidator 注入。
 */
const isSafeRedirectUrl = (rawUrl: string): boolean => {
  try {
    const { protocol } = new URL(rawUrl, window.location.origin);

    if (protocol === 'https:') {
      return true;
    }
    return protocol === 'http:' && getEnvironment() === Environment.Development;
  } catch {
    return false;
  }
};

// 用临时 a 标签而非 location.href：部分环境下后者会被拦截
const redirectTo = (url: string) => {
  const redirectLink = document.createElement('a');
  redirectLink.setAttribute('href', url);
  document.body.appendChild(redirectLink);
  redirectLink.click();
  redirectLink.remove();
};

export const resetSsoRedirectState = () => {
  isRedirecting = false;
};

export const ssoInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse<unknown>) => {
    const { data, config } = response;
    if (!isSsoResponse(data)) {
      return response;
    }

    const { returncode, redirectUrl } = data;
    if (returncode !== UNAUTHORIZED_CODE) {
      return response;
    }

    if (redirectUrl == null || redirectUrl === '') {
      throw new RequestError(RequestErrorType.Unauthorized, 'SSO 重定向地址缺失', { config });
    }
    if (!isSafeRedirectUrl(redirectUrl)) {
      throw new RequestError(RequestErrorType.Unauthorized, 'SSO 重定向地址非法', { config });
    }

    if (!isRedirecting) {
      isRedirecting = true;
      // 跳转成功时本模块会随页面卸载，这个定时器不会等到触发；没跳成才走到复位
      setTimeout(resetSsoRedirectState, REDIRECT_LATCH_TIMEOUT_MS);
      redirectTo(redirectUrl);
    }

    throw new RequestError(RequestErrorType.Unauthorized, '用户未登录，正在跳转...', { config });
  },
};
