import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { networkErrorInterceptor } from '@/apis/interceptors/error/network';
import { RequestError, RequestErrorType } from '@/apis/utils/error';

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

const mockMessageError = vi.mocked(message.error);

describe('networkErrorInterceptor.onRejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('归一后的错误默认弹出提示并继续拒绝', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络连接失败');

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).toHaveBeenCalledWith('网络连接失败');
  });

  it('配置 networkError.isSilent 时不弹出提示', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络连接失败', {
      config: { networkError: { isSilent: true } },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('仍有重试次数且错误可重试时不提示', async () => {
    const error = new RequestError(RequestErrorType.Timeout, '请求超时', {
      config: { __retriesLeft: 2 },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('有重试次数但错误不可重试时仍提示', async () => {
    const error = new RequestError(RequestErrorType.Http, '请求参数有误', {
      status: 400,
      config: { __retriesLeft: 2 },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).toHaveBeenCalledWith('请求参数有误');
  });

  it('取消类错误不提示', async () => {
    const error = new RequestError(RequestErrorType.Canceled, '请求已取消');

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockMessageError).not.toHaveBeenCalled();
  });
});
