import type { ResInterceptor } from '../../types/interceptor';
import {
  classifyAxiosError,
  isRetryableError,
  RequestError,
  RequestErrorType,
} from '../../utils/error';
import { notifyError } from '../../utils/error-notifier';

export const networkErrorInterceptor: ResInterceptor = {
  onRejected: (error: unknown) => {
    const requestError = classifyAxiosError(error);
    const { type, config, status, code, message: defaultMessage } = requestError;

    const { isSilent = false, customMessage } = config?.networkError ?? {};
    const errorMessage = customMessage ?? defaultMessage;
    const retriesLeft = config?.__retriesLeft ?? 0;
    const willRetry = retriesLeft > 0 && isRetryableError(requestError);

    // 取消的请求不提示；即将重试的错误也不提示，等最终失败时只提示一次
    if (!isSilent && !willRetry && type !== RequestErrorType.Canceled) {
      notifyError(errorMessage);
    }

    // 与业务错误对齐：customMessage 同时作用提示与抛出文案
    const rejectedError =
      customMessage == null
        ? requestError
        : new RequestError(type, errorMessage, { status, code, config });

    return Promise.reject(rejectedError);
  },
};
