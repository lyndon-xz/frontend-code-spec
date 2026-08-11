import axios, {
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios';
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGetRequest } from '@/apis/request';
import {
  type AnalyticsSender,
  RequestStatus,
  resetAnalyticsSender,
  setAnalyticsSender,
} from '@/apis/utils/analytics-reporter';
import { RequestErrorType } from '@/apis/utils/error';
import {
  type ErrorNotifier,
  resetErrorNotifier,
  setErrorNotifier,
} from '@/apis/utils/error-notifier';
import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

/*
 * 与 request.test.ts 的分工：那边把 axios 实例整体换成假对象，只验证 createRequest 自身的编排；
 * 这里保留真实 axios 与全部拦截器、只换掉最底层 adapter，守住跨拦截器的契约
 * （重试期间的提示抑制、失败埋点、拆包）——这类契约在实例被 mock 掉时无人校验。
 */

vi.mock('@/utils/environment', () => ({
  getEnvironment: vi.fn(),
}));

// 只替换 delay，保留真实的退避计算
vi.mock('@/apis/utils/retry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/apis/utils/retry')>();
  return { ...actual, delay: vi.fn(() => Promise.resolve()) };
});

const actualCreate = axios.create.bind(axios);

// 当前用例的最底层响应行为，由各用例改写
let respond: AxiosAdapter = () => Promise.reject(new Error('adapter 未设置'));

const buildResponse = (
  config: InternalAxiosRequestConfig,
  body: unknown,
  status = 200,
): AxiosResponse => ({
  data: body,
  status,
  statusText: 'OK',
  headers: {},
  config,
});

// 每个用例用独立 serviceCode，绕开 RequestInstance 的静态实例缓存
let codeSeq = 0;
const nextServiceCode = () => {
  codeSeq += 1;
  return `chain-${codeSeq}`;
};

describe('拦截器链端到端', () => {
  let notify: Mock<ErrorNotifier>;
  let report: Mock<AnalyticsSender>;

  beforeEach(() => {
    vi.clearAllMocks();
    // 埋点上报只在非开发环境走可注入的 sender，开发环境只打印
    vi.mocked(getEnvironment).mockReturnValue(Environment.Production);

    notify = vi.fn<ErrorNotifier>();
    report = vi.fn<AnalyticsSender>();
    setErrorNotifier(notify);
    setAnalyticsSender(report);

    // 实例创建时注入 adapter，其余配置与生产路径完全一致
    vi.spyOn(axios, 'create').mockImplementation((config) =>
      actualCreate({ ...config, adapter: (requestConfig) => respond(requestConfig) }),
    );
  });

  afterEach(() => {
    resetErrorNotifier();
    resetAnalyticsSender();
    vi.restoreAllMocks();
  });

  it('成功响应经业务拦截器拆包，并上报成功埋点', async () => {
    respond = (config) =>
      Promise.resolve(
        buildResponse(config, { code: 0, message: 'ok', timestampMs: 1, data: { id: 7 } }),
      );

    const run = createGetRequest(nextServiceCode());
    const result = await run<{ id: number }>({ url: '/flight/detail' });

    expect(result).toEqual({ id: 7 });
    expect(notify).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ status: RequestStatus.Success, requestId: expect.any(String) }),
    );
  });

  it('网络错误重试期间只提示一次，且每次失败都有埋点', async () => {
    respond = (config) =>
      Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));

    const run = createGetRequest(nextServiceCode());
    const result = await run({ url: '/flight/list', retry: { count: 2 } });

    expect(result).toBeNull();

    /*
     * 三次尝试里只有最后一次该提示：前两次的错误带着 __retriesLeft > 0，网络拦截器据此静默。
     * 依赖 classifyAxiosError 在无 response 的分支上带出 config，config 丢了就会连收三条提示。
     */
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith('网络连接失败，请检查网络后重试');

    // 埋点同样依赖 config（requestId / startTimeMs 都挂在上面），丢了就是网络类错误零上报
    expect(report).toHaveBeenCalledTimes(3);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        status: RequestStatus.Error,
        errorMessage: '网络连接失败，请检查网络后重试',
      }),
    );

    // 三次尝试共用一个 requestId，否则埋点侧看到的是三条互不关联的失败记录
    const reportedIds = report.mock.calls.map((call) => call[0].requestId);
    expect(new Set(reportedIds).size).toBe(1);
  });

  it('业务错误提示服务端文案、不重试，并抛出可分类的错误', async () => {
    respond = (config) =>
      Promise.resolve(
        buildResponse(config, { code: 4001, message: '余票不足', timestampMs: 1, data: null }),
      );

    const run = createGetRequest(nextServiceCode());
    const pending = run({ url: '/flight/book', retry: { count: 2 }, isErrorSwallowed: false });

    await expect(pending).rejects.toMatchObject({
      type: RequestErrorType.Business,
      code: 4001,
      message: '余票不足',
    });
    expect(notify).toHaveBeenCalledExactlyOnceWith('余票不足');
  });

  it('静默配置下不提示，但埋点照常上报', async () => {
    respond = (config) =>
      Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));

    const run = createGetRequest(nextServiceCode());
    await run({ url: '/flight/list', networkError: { isSilent: true } });

    expect(notify).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledTimes(1);
  });
});
