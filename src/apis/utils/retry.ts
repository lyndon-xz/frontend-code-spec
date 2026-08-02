import type { RetryOptions } from '../types/config';

const DEFAULT_RETRY_DELAY_MS = 300;

/**
 * 计算第 attempt 次重试（1 起）的等待时间，支持指数退避。
 * retry 允许缺省：调用方只在确实要重试时才持有配置，无需先做一次非空判断。
 */
export const getRetryDelay = (attempt: number, retry?: RetryOptions): number => {
  const delayMs = retry?.delayMs ?? DEFAULT_RETRY_DELAY_MS;
  const isBackoff = retry?.isBackoff ?? true;
  return isBackoff ? delayMs * 2 ** (attempt - 1) : delayMs;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
