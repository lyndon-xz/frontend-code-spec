import type { GenericAbortSignal } from 'axios';

import type { RetryOptions } from '../types/config';

import { CANCELED_MESSAGE, RequestError, RequestErrorType, isRetryableError } from './error';

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

/** 瞬时故障与重发安全两个条件都要成立 */
export const canRetry = (error: unknown, method: string, retry?: RetryOptions): boolean => {
  if (!isRetryableError(error)) {
    return false;
  }

  return retry?.isIdempotent ?? IDEMPOTENT_METHODS.has(method.toUpperCase());
};

const DEFAULT_RETRY_DELAY_MS = 300;

// 无封顶时 count 稍大就把请求挂住几分钟：300ms 退避到第 8 次已是 38s，累计近 80s
const DEFAULT_MAX_RETRY_DELAY_MS = 5000;

/** 计算第 attempt 次重试（从 1 起）的等待时间 */
export const getRetryDelay = (attempt: number, retry?: RetryOptions): number => {
  const {
    delayMs = DEFAULT_RETRY_DELAY_MS,
    isBackoff = true,
    maxDelayMs = DEFAULT_MAX_RETRY_DELAY_MS,
  } = retry ?? {};

  if (!isBackoff) {
    return Math.min(delayMs, maxDelayMs);
  }
  return Math.min(delayMs * 2 ** (attempt - 1), maxDelayMs);
};

/** 退避等待，请求取消时立即中断 */
export const delay = (ms: number, signal?: GenericAbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
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

    // 监听方法在部分宿主不存在，退化成等满退避时间
    signal?.addEventListener?.('abort', abortWaiting, { once: true });
  });
};
