import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPostRequest } from '@/apis/request';

vi.mock('axios', () => ({
  default: { create: vi.fn() },
}));

const mockCreate = vi.mocked(axios.create);

const buildMockInstance = () => ({
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  post: vi.fn().mockResolvedValue({ data: { ok: true } }),
});

let serviceSeq = 0;
const nextServiceCode = () => `svc-${serviceSeq++}`;

describe('createPostRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockImplementation(() => buildMockInstance() as never);
  });

  it('creates an axios instance with the resolved defaults', async () => {
    const request = createPostRequest(nextServiceCode());

    await request({ url: '/api/x', params: { a: 1 } });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const config = mockCreate.mock.calls[0]![0]!;
    expect(config.timeout).toBe(3000);
    expect(config.withCredentials).toBe(true);
    expect(config.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(config.baseURL).toContain('/api/');
  });

  it('registers one request and five response interceptors', async () => {
    const request = createPostRequest(nextServiceCode());

    await request({ url: '/api/x', params: {} });

    const instance = mockCreate.mock.results[0]!.value;
    expect(instance.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(instance.interceptors.response.use).toHaveBeenCalledTimes(5);
  });

  it('posts to the url with params and returns the response data', async () => {
    const request = createPostRequest(nextServiceCode());

    const data = await request({ url: '/api/x', params: { a: 1 }, headers: { 'X-Test': '1' } });

    const instance = mockCreate.mock.results[0]!.value;
    expect(instance.post).toHaveBeenCalledWith('/api/x', { a: 1 }, { headers: { 'X-Test': '1' } });
    expect(data).toEqual({ ok: true });
  });

  it('reuses the cached instance for the same service code', async () => {
    const request = createPostRequest(nextServiceCode());

    await request({ url: '/api/a', params: {} });
    await request({ url: '/api/b', params: {} });

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
