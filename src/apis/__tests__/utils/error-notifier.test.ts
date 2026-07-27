import { message } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { notifyError, resetErrorNotifier, setErrorNotifier } from '@/apis/utils/error-notifier';

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

const mockMessageError = vi.mocked(message.error);

describe('error-notifier', () => {
  afterEach(() => {
    resetErrorNotifier();
    vi.clearAllMocks();
  });

  it('默认走 antd message.error', () => {
    notifyError('网络异常');
    expect(mockMessageError).toHaveBeenCalledWith('网络异常');
  });

  it('setErrorNotifier 后走自定义实现', () => {
    const customNotifier = vi.fn();
    setErrorNotifier(customNotifier);

    notifyError('业务失败');

    expect(customNotifier).toHaveBeenCalledWith('业务失败');
    expect(mockMessageError).not.toHaveBeenCalled();
  });

  it('resetErrorNotifier 后恢复默认实现', () => {
    setErrorNotifier(vi.fn());
    resetErrorNotifier();

    notifyError('恢复默认');

    expect(mockMessageError).toHaveBeenCalledWith('恢复默认');
  });
});
