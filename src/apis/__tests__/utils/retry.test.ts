import { afterEach, describe, expect, it, vi } from 'vitest';

import { delay, getRetryDelay } from '@/apis/utils/retry';

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
});

describe('getRetryDelay', () => {
  it('默认指数退避：第一次重试使用基础间隔', () => {
    expect(getRetryDelay(1, { count: 3 })).toBe(300);
  });

  it('默认指数退避：第 n 次为 base * 2^(n-1)', () => {
    expect(getRetryDelay(2, { count: 3 })).toBe(600);
    expect(getRetryDelay(3, { count: 3 })).toBe(1200);
  });

  it('自定义基础间隔参与指数退避计算', () => {
    expect(getRetryDelay(3, { count: 3, delayMs: 100 })).toBe(400);
  });

  it('关闭退避时恒为基础间隔', () => {
    expect(getRetryDelay(5, { count: 3, delayMs: 200, isBackoff: false })).toBe(200);
  });

  it('关闭退避且未指定间隔时使用默认间隔', () => {
    expect(getRetryDelay(4, { count: 3, isBackoff: false })).toBe(300);
  });

  // retry 缺省时全部走默认值，调用方因此不需要先判空
  it('未传 retry 时使用默认间隔与默认退避', () => {
    expect(getRetryDelay(1)).toBe(300);
    expect(getRetryDelay(3)).toBe(1200);
  });
});
