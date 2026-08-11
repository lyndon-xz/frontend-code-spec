import type { AxiosResponse } from 'axios';

import { UNAUTHORIZED_CODE } from '../constants/code';
import type { ResInterceptor } from '../types/interceptor';
import type { SsoResponse } from '../types/response';
import { RequestError, RequestErrorType } from '../utils/error';

// 多个请求同时未授权时只触发一次跳转
let isRedirecting = false;

// 严格校验数值类型，否则 returncode 为 "-100" 时未授权会被当成已登录放行
const isSsoResponse = (body: unknown): body is SsoResponse => {
  return (
    typeof body === 'object' &&
    body !== null &&
    'returncode' in body &&
    typeof body.returncode === 'number'
  );
};

// 只放行 http/https，拦掉 javascript:/data: 等危险协议
const isSafeRedirectUrl = (rawUrl: string): boolean => {
  try {
    const { protocol } = new URL(rawUrl, window.location.origin);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

// 用临时 a 标签而非 location.href：后者在部分环境下会被拦截
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
  onFulfilled: (response: AxiosResponse) => {
    const { data, config } = response;
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
