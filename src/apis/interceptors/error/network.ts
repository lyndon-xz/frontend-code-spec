import type { ResInterceptor } from '../../types/interceptors';
import { RequestError, RequestErrorType, toRequestError } from '../../utils/error';
import { notifyError } from '../../utils/error-notifier';
import { canRetry } from '../../utils/retry';

export const networkErrorInterceptor: ResInterceptor = {
  onRejected: (error: unknown) => {
    const requestError = toRequestError(error);
    const { type, config, status, code, message: rawMessage } = requestError;
    const { networkError, method, retry } = config ?? {};
    const retriesLeft = retry?.retriesLeft ?? 0;

    const { isSilent = false, customMessage } = networkError ?? {};
    const errorMessage = customMessage ?? rawMessage;
    // 必须与 sendWithRetry 用同一个 canRetry 判定
    const willRetry = retriesLeft > 0 && method != null && canRetry(requestError, method, retry);

    // 取消的请求不提示；即将重试的也不提示，等最终失败只提示一次
    if (!isSilent && !willRetry && type !== RequestErrorType.Canceled) {
      notifyError(errorMessage);
    }

    // customMessage 同时作用提示与抛出文案
    const rejectedError =
      customMessage == null
        ? requestError
        : new RequestError(type, errorMessage, { status, code, config });

    return Promise.reject(rejectedError);
  },
};
