import type { RetryOptions } from '../types/config';

const DEFAULT_RETRY_DELAY_MS = 300;

/** 计算第 attempt 次重试（1 起）的等待时间，支持指数退避 */
export const getRetryDelay = (retry: RetryOptions, attempt: number): number => {
  const { delayMs = DEFAULT_RETRY_DELAY_MS, isBackoff = true } = retry;
  return isBackoff ? delayMs * 2 ** (attempt - 1) : delayMs;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
