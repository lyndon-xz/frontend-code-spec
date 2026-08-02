import { afterEach, describe, expect, it, vi } from 'vitest';

import { APP_ENV_KEY, Environment } from '@/constants/environment';
import {
  getEnvironment,
  resetEnvironmentProvider,
  setEnvironmentProvider,
} from '@/utils/environment';

const originalLocation = window.location;

// 判定依赖 window.location.hostname，用可配置属性替换以模拟不同域名
const stubHostname = (hostname: string) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { hostname },
  });
};

describe('getEnvironment', () => {
  afterEach(() => {
    // 先还原被 stub 掉的 window 本体，否则下面拿不到对象来恢复 location
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    resetEnvironmentProvider();
  });

  describe('构建期注入的标识优先', () => {
    it('注入 production 时即使域名是 localhost 也判定为生产', () => {
      vi.stubEnv(APP_ENV_KEY, Environment.Production);
      stubHostname('localhost');

      expect(getEnvironment()).toBe(Environment.Production);
    });

    it('注入 development 时即使域名是线上域名也判定为开发', () => {
      vi.stubEnv(APP_ENV_KEY, Environment.Development);
      stubHostname('api.example.com');

      expect(getEnvironment()).toBe(Environment.Development);
    });

    it('注入了无法识别的取值时回落到域名判断', () => {
      vi.stubEnv(APP_ENV_KEY, 'staging');
      stubHostname('localhost');

      expect(getEnvironment()).toBe(Environment.Development);
    });
  });

  describe('未注入标识时按域名兜底', () => {
    it.each([
      ['localhost', Environment.Development],
      ['127.0.0.1', Environment.Development],
      // 回环是整个 127.0.0.0/8 网段，不止 127.0.0.1
      ['127.20.5.3', Environment.Development],
      ['0.0.0.0', Environment.Development],
      ['[::1]', Environment.Development],
      // mDNS 自签域名，局域网内联调真机常用
      ['my-mac.local', Environment.Development],
      ['api.example.com', Environment.Production],
      ['', Environment.Production],
      // 域名里含 localhost 子串但并非本机，不能误判
      ['localhost.attacker.com', Environment.Production],
    ])('%s 判定为 %s', (hostname, expected) => {
      stubHostname(hostname);

      expect(getEnvironment()).toBe(expected);
    });
  });

  describe('无 window 的运行时', () => {
    it('SSR / Node 脚本下按生产处理，不把调试日志与埋点旁路带到服务端', () => {
      vi.stubGlobal('window', undefined);

      expect(getEnvironment()).toBe(Environment.Production);
    });
  });

  describe('可注入的判定实现', () => {
    it('注入的 provider 覆盖默认判定', () => {
      stubHostname('localhost');
      setEnvironmentProvider(() => Environment.Production);

      expect(getEnvironment()).toBe(Environment.Production);
    });

    it('复位后回到默认判定', () => {
      stubHostname('localhost');
      setEnvironmentProvider(() => Environment.Production);
      resetEnvironmentProvider();

      expect(getEnvironment()).toBe(Environment.Development);
    });
  });
});
