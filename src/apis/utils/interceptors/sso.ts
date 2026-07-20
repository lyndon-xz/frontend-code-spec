import type { AxiosResponse } from 'axios';

import { UNAUTHORIZED_CODE } from '../../constants/code';
import type { ResInterceptor } from '../../types/interceptor';

interface SsoResponse {
  returncode: number;
  redirectUrl?: string;
}

const isSsoResponse = (responseBody: unknown): responseBody is SsoResponse => {
  return typeof responseBody === 'object' && responseBody !== null && 'returncode' in responseBody;
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

export const ssoInterceptor: ResInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    const { data } = response ?? {};
    if (!isSsoResponse(data)) return response;

    const { returncode, redirectUrl } = data;

    if (returncode === UNAUTHORIZED_CODE) {
      if (redirectUrl == null || redirectUrl === '') {
        throw new Error('SSO 重定向地址缺失');
      }

      if (!isSafeRedirectUrl(redirectUrl)) {
        throw new Error('SSO 重定向地址非法');
      }

      const redirectLink = document.createElement('a');
      redirectLink.setAttribute('href', redirectUrl);
      document.body.appendChild(redirectLink);
      redirectLink.click();
      redirectLink.remove();

      throw new Error('用户未登录，正在跳转...');
    }

    return response;
  },
};
