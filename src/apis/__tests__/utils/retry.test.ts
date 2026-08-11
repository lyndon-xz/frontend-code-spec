import { afterEach, describe, expect, it, vi } from 'vitest';

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
