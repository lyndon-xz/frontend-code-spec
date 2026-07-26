import { message } from 'antd';

import type { ResInterceptor } from '../../types/interceptor';
import { classifyAxiosError, isRetryableError, RequestErrorType } from '../../utils/error';

export const networkErrorInterceptor: ResInterceptor = {
  onRejected: (error: unknown) => {
    const requestError = classifyAxiosError(error);
    const { type, config, message: errorMessage } = requestError;

    const isSilent = config?.networkError?.isSilent ?? false;
    const retriesLeft = config?.__retriesLeft ?? 0;
    const willRetry = retriesLeft > 0 && isRetryableError(requestError);

    // 取消的请求不提示；即将重试的错误也不提示，等最终失败时只提示一次
    if (!isSilent && !willRetry && type !== RequestErrorType.Canceled) {
      message.error(errorMessage);
    }

    return Promise.reject(requestError);
  },
};
