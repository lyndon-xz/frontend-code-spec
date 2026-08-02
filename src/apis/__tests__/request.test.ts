import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDeleteRequest,
  createGetRequest,
  createPostRequest,
  createPutRequest,
  createRequest,
} from '@/apis/request';
import type { EnhancedRequestConfig } from '@/apis/types/config';
import { registerDedupe } from '@/apis/utils/dedupe';
import { RequestError, RequestErrorType } from '@/apis/utils/error';
import { delay } from '@/apis/utils/retry';
import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

// 保留真实 axios 的类型守卫/错误类，仅接管实例创建
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, create: vi.fn() } };
});

vi.mock('@/apis/utils/base-url', () => ({
  generateBaseUrl: vi.fn(() => 'http://test/api/x'),
}));

vi.mock('@/apis/utils/dedupe', () => ({
  registerDedupe: vi.fn(),
}));

// delay 直接 resolve，避免真实定时器拖慢重试用例
vi.mock('@/apis/utils/retry', () => ({
  delay: vi.fn(() => Promise.resolve()),
  getRetryDelay: vi.fn(() => 0),
}));

vi.mock('@/utils/environment', () => ({
  getEnvironment: vi.fn(),
}));

const mockCreate = vi.mocked(axios.create);
const mockRegisterDedupe = vi.mocked(registerDedupe);
const mockDelay = vi.mocked(delay);
const mockGetEnvironment = vi.mocked(getEnvironment);

interface FakeInstance {
  interceptors: {
    request: { use: ReturnType<typeof vi.fn> };
    response: { use: ReturnType<typeof vi.fn> };
  };
  request: ReturnType<typeof vi.fn>;
}

const buildFakeInstance = (): FakeInstance => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  request: vi.fn(),
});

// 每个用例用独立 serviceCode，绕开 RequestInstance 的静态实例缓存造成的跨用例串扰
let codeSeq = 0;
const nextServiceCode = () => {
  codeSeq += 1;
  return `svc-${codeSeq}`;
};

// 便捷创建：返回请求函数与其底层 fake 实例，实例的 request 由用例自行编排
const setupRequest = () => {
  const instance = buildFakeInstance();
  mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
  const run = createGetRequest(nextServiceCode());
  return { instance, run };
};

describe('createRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvironment.mockReturnValue(Environment.Development);
  });

  it('成功时返回响应拆包后的 data', async () => {
    const { instance, run } = setupRequest();
    instance.request.mockResolvedValue({ data: { id: 1 } });

    await expect(run<{ id: number }>({ url: '/x' })).resolves.toEqual({ id: 1 });
  });

  it('失败时默认吞掉错误并返回 null', async () => {
    const { instance, run } = setupRequest();
    instance.request.mockRejectedValue(new RequestError(RequestErrorType.Business, '业务失败'));

    await expect(run({ url: '/x' })).resolves.toBeNull();
  });

  it('isErrorSwallowed 为 false 时抛出原始错误', async () => {
    const { instance, run } = setupRequest();
    const error = new RequestError(RequestErrorType.Business, '业务失败');
    instance.request.mockRejectedValue(error);

    await expect(run({ url: '/x', isErrorSwallowed: false })).rejects.toBe(error);
  });

  it('注入剩余重试次数 __retriesLeft', async () => {
    const { instance, run } = setupRequest();
    instance.request.mockResolvedValue({ data: null });

    await run({ url: '/x', retry: { count: 2 } });

    expect(instance.request).toHaveBeenCalledWith(
      expect.objectContaining({ __retriesLeft: 2, method: 'GET' }),
    );
  });

  describe('重试', () => {
    it('可重试错误在首次失败后重试并最终成功', async () => {
      const { instance, run } = setupRequest();
      instance.request
        .mockRejectedValueOnce(new RequestError(RequestErrorType.Network, '网络错误'))
        .mockResolvedValueOnce({ data: { ok: true } });

      await expect(run({ url: '/x', retry: { count: 1 } })).resolves.toEqual({ ok: true });
      expect(instance.request).toHaveBeenCalledTimes(2);
      expect(mockDelay).toHaveBeenCalledTimes(1);
    });

    it('重试次数耗尽后按吞错策略返回 null', async () => {
      const { instance, run } = setupRequest();
      instance.request.mockRejectedValue(new RequestError(RequestErrorType.Timeout, '超时'));

      await expect(run({ url: '/x', retry: { count: 1 } })).resolves.toBeNull();
      expect(instance.request).toHaveBeenCalledTimes(2);
    });

    it('不可重试错误不触发重试', async () => {
      const { instance, run } = setupRequest();
      instance.request.mockRejectedValue(new RequestError(RequestErrorType.Business, '业务失败'));

      await expect(run({ url: '/x', retry: { count: 3 } })).resolves.toBeNull();
      expect(instance.request).toHaveBeenCalledTimes(1);
      expect(mockDelay).not.toHaveBeenCalled();
    });
  });

  describe('去重', () => {
    // 去重句柄替身：signal 供透传断言，release 供注销断言
    const buildDedupeHandle = () => ({
      signal: { aborted: false } as AbortSignal,
      release: vi.fn(),
    });

    it('开启去重且未自带 signal 时按服务与请求特征登记，并透传其 signal', async () => {
      const handle = buildDedupeHandle();
      mockRegisterDedupe.mockReturnValue(handle);

      const instance = buildFakeInstance();
      mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
      const serviceCode = nextServiceCode();
      const run = createGetRequest(serviceCode);
      instance.request.mockResolvedValue({ data: null });

      await run({ url: '/x', isDeduped: true, params: { page: 1 } });

      // serviceCode 必须并入签名，否则两个服务的同路径请求会互相取消
      expect(mockRegisterDedupe).toHaveBeenCalledWith({
        serviceCode,
        method: 'GET',
        url: '/x',
        params: { page: 1 },
        data: undefined,
      });
      expect(instance.request).toHaveBeenCalledWith(
        expect.objectContaining({ signal: handle.signal }),
      );
    });

    it('请求结束后注销去重登记', async () => {
      const handle = buildDedupeHandle();
      mockRegisterDedupe.mockReturnValue(handle);

      const { instance, run } = setupRequest();
      instance.request.mockResolvedValue({ data: null });

      await run({ url: '/x', isDeduped: true });

      expect(handle.release).toHaveBeenCalledTimes(1);
    });

    it('请求失败时同样注销去重登记', async () => {
      const handle = buildDedupeHandle();
      mockRegisterDedupe.mockReturnValue(handle);

      const { instance, run } = setupRequest();
      instance.request.mockRejectedValue(new RequestError(RequestErrorType.Business, '业务失败'));

      await run({ url: '/x', isDeduped: true });

      expect(handle.release).toHaveBeenCalledTimes(1);
    });

    it('调用方自带 signal 时不接管去重', async () => {
      const userSignal = { aborted: false } as AbortSignal;
      const { instance, run } = setupRequest();
      instance.request.mockResolvedValue({ data: null });

      await run({ url: '/x', isDeduped: true, signal: userSignal });

      expect(mockRegisterDedupe).not.toHaveBeenCalled();
      expect(instance.request).toHaveBeenCalledWith(
        expect.objectContaining({ signal: userSignal }),
      );
    });

    it('未开启去重时不登记控制器', async () => {
      const { instance, run } = setupRequest();
      instance.request.mockResolvedValue({ data: null });

      await run({ url: '/x' });

      expect(mockRegisterDedupe).not.toHaveBeenCalled();
    });
  });

  describe('实例缓存与配置漂移告警', () => {
    it('同一 serviceCode 复用同一实例，仅创建一次', () => {
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode);
      createPostRequest(serviceCode);

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('非开发环境命中缓存时静默跳过漂移告警', () => {
      mockGetEnvironment.mockReturnValue(Environment.Production);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode);
      createPostRequest(serviceCode);

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('开发环境再次创建且实例配置不同时告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode, { timeout: 3000 });
      createPostRequest(serviceCode, { timeout: 8000 });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`serviceCode "${serviceCode}"`));
      expect(mockCreate).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('开发环境 headers 不同时同样触发漂移告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode, { headers: { 'Content-Type': 'application/json' } });
      createPostRequest(serviceCode, { headers: { 'Content-Type': 'text/plain' } });

      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('开发环境实例配置相同时不告警', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode, { timeout: 5000 });
      createPostRequest(serviceCode, { timeout: 5000 });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

describe('按 HTTP 方法创建请求', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvironment.mockReturnValue(Environment.Development);
  });

  const runWithMethod = async (
    factory: (serviceCode: string) => (config: EnhancedRequestConfig) => Promise<unknown>,
  ) => {
    const instance = buildFakeInstance();
    mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
    const run = factory(nextServiceCode());
    instance.request.mockResolvedValue({ data: null });
    await run({ url: '/x' });
    return instance.request.mock.calls[0]![0] as { method: string };
  };

  it('createGetRequest 使用 GET', async () => {
    expect((await runWithMethod(createGetRequest)).method).toBe('GET');
  });

  it('createPostRequest 使用 POST', async () => {
    expect((await runWithMethod(createPostRequest)).method).toBe('POST');
  });

  it('createPutRequest 使用 PUT', async () => {
    expect((await runWithMethod(createPutRequest)).method).toBe('PUT');
  });

  it('createDeleteRequest 使用 DELETE', async () => {
    expect((await runWithMethod(createDeleteRequest)).method).toBe('DELETE');
  });

  it('createRequest 可直接指定任意方法', async () => {
    const instance = buildFakeInstance();
    mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
    const run = createRequest(nextServiceCode(), 'PATCH');
    instance.request.mockResolvedValue({ data: null });

    await run({ url: '/x' });

    expect(instance.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH' }));
  });
});
