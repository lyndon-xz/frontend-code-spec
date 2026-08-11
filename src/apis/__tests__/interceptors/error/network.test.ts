import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { networkErrorInterceptor } from '@/apis/interceptors/error/network';
import { RequestError, RequestErrorType } from '@/apis/utils/error';
import { resetErrorNotifier, setErrorNotifier } from '@/apis/utils/error-notifier';

const mockNotifyError = vi.fn();

describe('networkErrorInterceptor.onRejected', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setErrorNotifier(mockNotifyError);
  });

  afterEach(() => {
    resetErrorNotifier();
  });

  it('归一后的错误默认弹出提示并继续拒绝', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络连接失败');

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).toHaveBeenCalledWith('网络连接失败');
  });

  it('配置 networkError.customMessage 时用自定义文案提示', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络连接失败', {
      config: { networkError: { customMessage: '请检查网络后重试' } },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toMatchObject({
      message: '请检查网络后重试',
      type: RequestErrorType.Network,
    });
    expect(mockNotifyError).toHaveBeenCalledWith('请检查网络后重试');
  });

  it('配置 networkError.isSilent 时不弹出提示', async () => {
    const error = new RequestError(RequestErrorType.Network, '网络连接失败', {
      config: { networkError: { isSilent: true } },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).not.toHaveBeenCalled();
  });

  it('仍有重试次数且错误可重试时不提示', async () => {
    const error = new RequestError(RequestErrorType.Timeout, '请求超时', {
      config: { method: 'GET', __retriesLeft: 2 },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).not.toHaveBeenCalled();
  });

  // 抑制提示的判定须与 sendWithRetry 的 canRetry 同源，只看错误类型会让不重试的 POST 静默
  it('非幂等方法即使有重试次数也提示', async () => {
    const error = new RequestError(RequestErrorType.Timeout, '请求超时', {
      config: { method: 'POST', __retriesLeft: 2 },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).toHaveBeenCalledWith('请求超时');
  });

  it('非幂等方法显式声明幂等后抑制提示', async () => {
    const error = new RequestError(RequestErrorType.Timeout, '请求超时', {
      config: { method: 'POST', __retriesLeft: 2, retry: { count: 2, isIdempotent: true } },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).not.toHaveBeenCalled();
  });

  it('有重试次数但错误不可重试时仍提示', async () => {
    const error = new RequestError(RequestErrorType.Http, '请求参数有误', {
      status: 400,
      config: { method: 'GET', __retriesLeft: 2 },
    });

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).toHaveBeenCalledWith('请求参数有误');
  });

  it('取消类错误不提示', async () => {
    const error = new RequestError(RequestErrorType.Canceled, '请求已取消');

    await expect(networkErrorInterceptor.onRejected!(error)).rejects.toBe(error);
    expect(mockNotifyError).not.toHaveBeenCalled();
  });
});
