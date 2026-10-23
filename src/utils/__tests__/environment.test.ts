import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_ENV_KEY, Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

describe('getEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('注入 development 时为开发', () => {
    vi.stubEnv(APP_ENV_KEY, Environment.Development);

    expect(getEnvironment()).toBe(Environment.Development);
  });

  it('注入 production 时为生产', () => {
    vi.stubEnv(APP_ENV_KEY, Environment.Production);

    expect(getEnvironment()).toBe(Environment.Production);
  });

  it('注入了无法识别的取值时按生产处理', () => {
    vi.stubEnv(APP_ENV_KEY, 'staging');

    expect(getEnvironment()).toBe(Environment.Production);
  });

  it('没有注入时按生产处理', () => {
    expect(getEnvironment()).toBe(Environment.Production);
  });

  it('没有 window 时也不抛错，按生产处理', () => {
    vi.stubGlobal('window', undefined);

    expect(getEnvironment()).toBe(Environment.Production);
  });
});
