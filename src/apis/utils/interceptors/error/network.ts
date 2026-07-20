import { message } from 'antd';

import type { ResInterceptor } from '../../../types/interceptor';
import { isAxiosLikeError } from '../../../utils/guards';

export const networkErrorInterceptor: ResInterceptor = {
  onRejected: (error: unknown) => {
    if (isAxiosLikeError(error)) {
      const { networkError: { isSilent = false } = {} } = error.config ?? {};

      if (!isSilent) {
        message.error('网络请求失败，请重试');
      }
    } else {
      message.error('网络请求失败，请重试');
    }

    return Promise.reject(error);
  },
};
