import type { AxiosResponse } from 'axios';

import { UNAUTHORIZED_CODE } from '../constants/code';
import type { ResInterceptor } from '../types/interceptor';
import type { SsoResponse } from '../types/response';
import { RequestError, RequestErrorType } from '../utils/error';

// 多个请求同时未授权时，只触发一次跳转；业务可在取消登录回流后调用 resetSsoRedirectState 复位
let isRedirecting = false;

// 判定是否为 SSO 信封；与 business 拦截器口径一致地校验类型，否则 returncode 为 "-100" 时未授权会被当成已登录放行
const isSsoResponse = (body: unknown): body is SsoResponse => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'returncode' in body &&
    typeof body.returncode === 'number'
  );
};

// 仅允许跳转到 http/https 目标，拦截 javascript:/data: 等危险协议，避免开放重定向
const isSafeRedirectUrl = (rawUrl: string): boolean => {
  try {
    const { protocol } = new URL(rawUrl, window.location.origin);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

// 通过临时 a 标签触发跳转（兼容部分环境下 location.href 被拦截的场景）
const redirectTo = (url: string) => {
  const redirectLink = document.createElement('a');
  redirectLink.setAttribute('href', url);
  document.body.appendChild(redirectLink);
  redirectLink.click();
  redirectLink.remove();
};

/** 复位 SSO 跳转闩锁（SPA 回流 / 测试场景） */
export const resetSsoRedirectState = () => {
  isRedirecting = false;
};

export const ssoInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const { data, config } = response ?? {};
    if (!isSsoResponse(data)) return response;

    const { returncode, redirectUrl } = data;
    if (returncode !== UNAUTHORIZED_CODE) return response;

    if (redirectUrl == null || redirectUrl === '') {
      throw new RequestError(RequestErrorType.Unauthorized, 'SSO 重定向地址缺失', { config });
    }
    if (!isSafeRedirectUrl(redirectUrl)) {
      throw new RequestError(RequestErrorType.Unauthorized, 'SSO 重定向地址非法', { config });
    }

    if (!isRedirecting) {
      isRedirecting = true;
      redirectTo(redirectUrl);
    }

    throw new RequestError(RequestErrorType.Unauthorized, '用户未登录，正在跳转...', { config });
  },
};
