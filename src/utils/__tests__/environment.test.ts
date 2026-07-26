import { afterEach, describe, expect, it } from 'vitest';

import { Environment } from '@/constants/environment';
import { getEnvironment } from '@/utils/environment';

const originalLocation = window.location;

// getEnvironment 依赖 window.location.hostname，用可配置属性替换以模拟不同域名
const stubHostname = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { hostname },
  });
};

describe('getEnvironment', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('localhost 判定为开发环境', () => {
    stubHostname('localhost');

    expect(getEnvironment()).toBe(Environment.Development);
  });

  it('127.0.0.1 判定为开发环境', () => {
    stubHostname('127.0.0.1');

    expect(getEnvironment()).toBe(Environment.Development);
  });

  it('非本地域名判定为生产环境', () => {
    stubHostname('api.example.com');

    expect(getEnvironment()).toBe(Environment.Production);
  });

  it('空 hostname 判定为生产环境', () => {
    stubHostname('');

    expect(getEnvironment()).toBe(Environment.Production);
  });
});
