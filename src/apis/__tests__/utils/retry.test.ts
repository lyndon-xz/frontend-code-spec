import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RetryOptions } from '@/apis/types/request/config';
import { RequestError, RequestErrorType } from '@/apis/utils/error';
import { canRetry, delay, getRetryDelay } from '@/apis/utils/retry';

const timeoutError = new RequestError(RequestErrorType.Timeout, '超时');

describe('canRetry', () => {
  it('幂等方法遇瞬时故障可重试', () => {
    expect(canRetry(timeoutError, 'GET')).toBe(true);
    expect(canRetry(timeoutError, 'put')).toBe(true);
    expect(canRetry(timeoutError, 'DELETE')).toBe(true);
  });

  // POST 超时可能是服务端已处理、只是响应没回来，重试就是重复提交
  it('非幂等方法默认不重试', () => {
    expect(canRetry(timeoutError, 'POST')).toBe(false);
    expect(canRetry(timeoutError, 'PATCH')).toBe(false);
  });

  it('显式声明幂等后非幂等方法也重试', () => {
    expect(canRetry(timeoutError, 'POST', { count: 1, isIdempotent: true })).toBe(true);
  });

  it('显式声明不幂等可否决幂等方法的重试', () => {
    expect(canRetry(timeoutError, 'GET', { count: 1, isIdempotent: false })).toBe(false);
  });

  it('错误本身不可重试时方法不影响结论', () => {
    const businessError = new RequestError(RequestErrorType.Business, '业务失败');

    expect(canRetry(businessError, 'GET')).toBe(false);
    expect(canRetry(new RequestError(RequestErrorType.Canceled, '已取消'), 'GET')).toBe(false);
  });
});

describe('delay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('在指定毫秒后 resolve', async () => {
    vi.useFakeTimers();
    const onResolved = vi.fn();
    const pending = (async () => {
      await delay(500);
      onResolved();
    })();

    expect(onResolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    await pending;

    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it('传入已取消的 signal 时立即以取消错误 reject', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(delay(500, controller.signal)).rejects.toMatchObject({
      type: RequestErrorType.Canceled,
    });
  });

  // 等待期间被取消要立即中断，否则指数退避下会白等上千毫秒
  it('等待期间取消时立即 reject 并清掉定时器', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const pending = delay(1200, controller.signal);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ type: RequestErrorType.Canceled });
  });
});

describe('getRetryDelay', () => {
  it('第一次重试等待 300ms', () => {
    expect(getRetryDelay(1)).toBe(300);
  });

  it('第 n 次为 300 * 2^(n-1)', () => {
    expect(getRetryDelay(2)).toBe(600);
    expect(getRetryDelay(3)).toBe(1200);
  });

  it('第 8 次停在 5000ms', () => {
    // 300 * 2^7 = 38400，无封顶时单次就要等 38 秒
    expect(getRetryDelay(8)).toBe(5000);
  });

  it('间隔、退避和封顶不是调用方选项', () => {
    // @ts-expect-error 等待时间已固定，不能再传 delayMs、isBackoff、maxDelayMs
    const options: RetryOptions = { count: 1, delayMs: 100, isBackoff: false, maxDelayMs: 1000 };

    expect(options.count).toBe(1);
  });
});
