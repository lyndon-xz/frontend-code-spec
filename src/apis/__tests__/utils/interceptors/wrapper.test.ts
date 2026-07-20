import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { wrapperInterceptor } from '@/apis/utils/interceptors/wrapper';

describe('wrapperInterceptor', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('swallows the error and resolves with null data by default', async () => {
    const result = await wrapperInterceptor.onRejected!({ config: {}, message: 'boom' });

    expect(result).toEqual({ data: null });
    expect(console.log).toHaveBeenCalledWith('[包装器拦截器] 捕获到错误: boom');
  });

  it('resolves with null data and a default message for non-axios errors', async () => {
    const result = await wrapperInterceptor.onRejected!('plain');

    expect(result).toEqual({ data: null });
    expect(console.log).toHaveBeenCalledWith('[包装器拦截器] 捕获到错误: 未知错误');
  });

  it('rethrows the error when isWrapper is disabled', async () => {
    const error = { config: { isWrapper: false }, message: 'boom' };

    await expect(wrapperInterceptor.onRejected!(error)).rejects.toBe(error);
  });
});
