import axios, { AxiosHeaders, type AxiosInstance, type Method } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authReqInterceptor } from '@/apis/interceptors/auth';
import {
  createDeleteRequest,
  createGetRequest,
  createPostRequest,
  createPutRequest,
  createRequest,
} from '@/apis/request';
import type { EnhancedRequestConfig } from '@/apis/types/request/config';
import { REQUEST_CAPABILITIES, type CreateRequestOptions } from '@/apis/types/request/options';
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

/*
 * 只替换 delay 与 getRetryDelay 以避开真实定时器；canRetry 保留真实实现——
 * 它承载「非幂等方法不重试」的判定，整体 mock 掉等于把这条防线从测试里摘掉。
 */
vi.mock('@/apis/utils/retry', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/apis/utils/retry')>()),
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

const withCapabilities = (
  options: Omit<CreateRequestOptions, 'capabilities'> = {},
): CreateRequestOptions => ({
  capabilities: REQUEST_CAPABILITIES,
  ...options,
});

// 便捷创建：返回请求函数与其底层 fake 实例，实例的 request 由用例自行编排
const setupRequest = (options: { method?: Method } = {}) => {
  const { method = 'GET' } = options;
  const instance = buildFakeInstance();
  mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
  const run = createRequest(nextServiceCode(), method, withCapabilities());
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

  it('count 保持调用方传入的次数，剩余次数写在 retriesLeft', async () => {
    const { instance, run } = setupRequest();
    const retry = { count: 2 };
    instance.request
      .mockRejectedValueOnce(new RequestError(RequestErrorType.Network, '网络错误'))
      .mockResolvedValueOnce({ data: { ok: true } });

    await expect(run({ url: '/x', retry })).resolves.toEqual({ ok: true });

    expect(retry).toEqual({ count: 2 });
    expect(instance.request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ retry: { count: 2, retriesLeft: 2 }, method: 'GET' }),
    );
    expect(instance.request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ retry: { count: 2, retriesLeft: 1 }, method: 'GET' }),
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

    it('显式声明不幂等时幂等方法也不重试', async () => {
      const { instance, run } = setupRequest();
      instance.request.mockRejectedValue(new RequestError(RequestErrorType.Timeout, '超时'));

      await expect(
        run({ url: '/x', retry: { count: 3, isIdempotent: false } }),
      ).resolves.toBeNull();
      expect(instance.request).toHaveBeenCalledTimes(1);
      expect(mockDelay).not.toHaveBeenCalled();
    });

    it('非幂等方法即使配了 retry 也不重试', async () => {
      const { instance, run } = setupRequest({ method: 'POST' });
      instance.request.mockRejectedValue(new RequestError(RequestErrorType.Timeout, '超时'));

      await expect(run({ url: '/x', retry: { count: 3 } })).resolves.toBeNull();
      // POST 超时可能是服务端已处理、只是响应没回来，重试会重复提交
      expect(instance.request).toHaveBeenCalledTimes(1);
      expect(mockDelay).not.toHaveBeenCalled();
    });

    it('非幂等方法显式声明幂等后才重试', async () => {
      const { instance, run } = setupRequest({ method: 'POST' });
      instance.request
        .mockRejectedValueOnce(new RequestError(RequestErrorType.Timeout, '超时'))
        .mockResolvedValueOnce({ data: { ok: true } });

      await expect(run({ url: '/x', retry: { count: 1, isIdempotent: true } })).resolves.toEqual({
        ok: true,
      });
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
      const run = createGetRequest(serviceCode, withCapabilities());
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

  describe('实例缓存', () => {
    it('同一 serviceCode 复用同一实例，仅创建一次', () => {
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode, withCapabilities());
      createPostRequest(serviceCode, withCapabilities());

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('headers 传 AxiosHeaders 实例时与默认头合并且不丢键', () => {
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(
        nextServiceCode(),
        withCapabilities({
          headers: new AxiosHeaders({ 'X-Trace-Id': 'trace-1', 'Content-Type': 'text/plain' }),
        }),
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { 'Content-Type': 'text/plain', 'X-Trace-Id': 'trace-1' },
        }),
      );
    });

    it('能力名单顺序不同仍复用同一实例', () => {
      const serviceCode = nextServiceCode();
      mockCreate.mockReturnValueOnce(buildFakeInstance() as unknown as AxiosInstance);

      createGetRequest(serviceCode, { capabilities: ['sso', 'auth'] });
      createPostRequest(serviceCode, { capabilities: ['auth', 'sso'] });

      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  it('缺少 capabilities 时类型不允许创建', () => {
    const createWithoutCapabilities = () => {
      // @ts-expect-error capabilities 是必填项，缺省不能当成全开
      createGetRequest(nextServiceCode());
    };

    expect(createWithoutCapabilities).toThrow();
  });

  it('只开 auth 时不挂其余拦截器，重试、去重与吞错都不生效', async () => {
    const instance = buildFakeInstance();
    mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
    const run = createGetRequest(nextServiceCode(), { capabilities: ['auth'] });
    const error = new RequestError(RequestErrorType.Network, '网络错误');
    instance.request.mockRejectedValue(error);

    await expect(
      run({ url: '/x', retry: { count: 2 }, isDeduped: true, isErrorSwallowed: true }),
    ).rejects.toBe(error);

    expect(instance.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(instance.interceptors.request.use).toHaveBeenCalledWith(
      authReqInterceptor.onFulfilled,
      authReqInterceptor.onRejected,
    );
    expect(instance.interceptors.response.use).not.toHaveBeenCalled();
    expect(instance.request).toHaveBeenCalledTimes(1);
    expect(instance.request.mock.calls[0]?.[0]).not.toHaveProperty('__requestId');
    expect(mockRegisterDedupe).not.toHaveBeenCalled();
    expect(mockDelay).not.toHaveBeenCalled();
  });

  it('同一 serviceCode 的两套能力各创建一个实例', () => {
    const serviceCode = nextServiceCode();
    const authOnly = buildFakeInstance();
    const full = buildFakeInstance();
    mockCreate
      .mockReturnValueOnce(authOnly as unknown as AxiosInstance)
      .mockReturnValueOnce(full as unknown as AxiosInstance);

    createGetRequest(serviceCode, { capabilities: ['auth'] });
    createGetRequest(serviceCode, withCapabilities());

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(authOnly.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(authOnly.interceptors.response.use).not.toHaveBeenCalled();
    expect(full.interceptors.request.use).toHaveBeenCalledTimes(2);
    expect(full.interceptors.response.use).toHaveBeenCalledTimes(4);
  });
});

describe('按 HTTP 方法创建请求', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvironment.mockReturnValue(Environment.Development);
  });

  const runWithMethod = async (
    factory: (
      serviceCode: string,
      options: CreateRequestOptions,
    ) => (config: EnhancedRequestConfig) => Promise<unknown>,
  ) => {
    const instance = buildFakeInstance();
    mockCreate.mockReturnValueOnce(instance as unknown as AxiosInstance);
    const run = factory(nextServiceCode(), withCapabilities());
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
    const run = createRequest(nextServiceCode(), 'PATCH', withCapabilities());
    instance.request.mockResolvedValue({ data: null });

    await run({ url: '/x' });

    expect(instance.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'PATCH' }));
  });
});
