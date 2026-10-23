import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateRequestId } from '@/apis/utils/request-id';

describe('generateRequestId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('用大写方法、url 与 randomUUID 拼出 id', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-1' });

    expect(generateRequestId('get', '/x')).toBe('GET_/x_uuid-1');
  });

  it('url 缺省时按空串拼接', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-2' });

    expect(generateRequestId('post')).toBe('POST__uuid-2');
  });

  it('crypto 没有 randomUUID 时退回时间戳加随机数', () => {
    vi.stubGlobal('crypto', {});
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(generateRequestId('get', '/x')).toBe('GET_/x_1000_0.5');
  });

  it('运行时没有 crypto 时同样退回时间戳加随机数', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    vi.spyOn(Math, 'random').mockReturnValue(0.25);

    expect(generateRequestId('get', '/y')).toBe('GET_/y_2000_0.25');
  });
});
