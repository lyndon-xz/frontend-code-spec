import type { RetryOptions } from '../types/config';

const DEFAULT_RETRY_DELAY = 300;

/** 计算第 attempt 次重试（1 起）的等待时间，支持指数退避 */
export const getRetryDelay = (retry: RetryOptions, attempt: number): number => {
  const { delay: base = DEFAULT_RETRY_DELAY, isBackoff = true } = retry;
  return isBackoff ? base * 2 ** (attempt - 1) : base;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
