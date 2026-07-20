import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { networkErrorInterceptor } from '@/apis/utils/interceptors/error/network';

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

const mockMessageError = vi.mocked(message.error);

describe('networkErrorInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a network error and rejects for axios-like errors', async () => {
    const error = { config: {} };

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).toHaveBeenCalledWith('网络请求失败，请重试');
  });

  it('falls back to an empty config when config is missing', async () => {
    const error = { config: undefined };

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).toHaveBeenCalledWith('网络请求失败，请重试');
  });

  it('stays silent when networkError.isSilent is set', async () => {
    const error = { config: { networkError: { isSilent: true } } };

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('shows a network error and rejects for non-axios errors', async () => {
    await expect(networkErrorInterceptor.onRejected!('boom')).rejects.toBe('boom');
    expect(mockMessageError).toHaveBeenCalledWith('网络请求失败，请重试');
  });
});
