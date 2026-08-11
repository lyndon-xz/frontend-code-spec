import type { GenericAbortSignal } from 'axios';

import type { RetryOptions } from '../types/config';

import { CANCELED_MESSAGE, RequestError, RequestErrorType, isRetryableError } from './error';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

/**
 * 两个条件都要成立：错误本身是瞬时故障，且这个请求重发是安全的。
 * 只看错误类型会让 POST 超时也重试，那是重复提交的入口（判据见 RetryOptions.isIdempotent）。
 */
export const canRetry = (error: unknown, method: string, retry?: RetryOptions): boolean => {
  if (!isRetryableError(error)) return false;

  return retry?.isIdempotent ?? IDEMPOTENT_METHODS.has(method.toUpperCase());
};

const DEFAULT_RETRY_DELAY_MS = 300;

/** 计算第 attempt 次重试（从 1 起）的等待时间 */
export const getRetryDelay = (attempt: number, retry?: RetryOptions): number => {
  const delayMs = retry?.delayMs ?? DEFAULT_RETRY_DELAY_MS;
  const isBackoff = retry?.isBackoff ?? true;
  return isBackoff ? delayMs * 2 ** (attempt - 1) : delayMs;
};

/** 退避等待。请求被取消时立即中断，否则指数退避下要白等上千毫秒还占着 timer */
export const delay = (ms: number, signal?: GenericAbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 与发出后被取消用同一个错误类型，调用方无需区分「取消发生在等待期」
    const rejectAsCanceled = () => {
      reject(new RequestError(RequestErrorType.Canceled, CANCELED_MESSAGE));
    };

    if (signal?.aborted === true) {
      rejectAsCanceled();
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener?.('abort', abortWaiting);
      resolve();
    }, ms);

    const abortWaiting = () => {
      clearTimeout(timer);
      rejectAsCanceled();
    };

    // GenericAbortSignal 把监听方法标为可选，宿主不支持时退化成等满退避时间
    signal?.addEventListener?.('abort', abortWaiting, { once: true });
  });
};
