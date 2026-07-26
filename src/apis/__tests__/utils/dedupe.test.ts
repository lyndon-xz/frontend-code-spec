import type { AxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { registerDedupe, releaseDedupe } from '@/apis/utils/dedupe';

// 每个用例用独立 url 生成唯一签名，隔离模块级 pendingRequests 的跨用例状态
let seq = 0;
const buildConfig = (overrides: Partial<AxiosRequestConfig> = {}): AxiosRequestConfig => {
  seq += 1;
  return { method: 'get', url: `/dedupe/${seq}`, ...overrides };
};

describe('registerDedupe', () => {
  it('返回一个未取消的 AbortController', () => {
    const controller = registerDedupe(buildConfig());

    expect(controller).toBeInstanceOf(AbortController);
    expect(controller.signal.aborted).toBe(false);
  });

  it('同签名请求再次登记时取消上一次在飞行中的请求', () => {
    const config = buildConfig({ params: { page: 1 } });

    const first = registerDedupe(config);
    const second = registerDedupe(config);

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('不同签名的请求互不影响', () => {
    const first = registerDedupe(buildConfig({ params: { page: 1 } }));
    const second = registerDedupe(buildConfig({ params: { page: 2 } }));

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('参数为不可序列化的宿主对象时不参与去重', () => {
    const formData = new FormData();
    const config = buildConfig({ data: formData });

    const first = registerDedupe(config);
    const second = registerDedupe(config);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('参数存在循环引用无法序列化时不参与去重', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const config = buildConfig({ params: circular });

    const first = registerDedupe(config);
    const second = registerDedupe(config);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });
});

describe('releaseDedupe', () => {
  it('释放后同签名请求重新登记不会取消已释放的控制器', () => {
    const config = buildConfig({ params: { q: 'a' } });

    const first = registerDedupe(config);
    releaseDedupe(config, first);
    const second = registerDedupe(config);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('传入非当前登记的控制器时不误删已被覆盖的登记', () => {
    const config = buildConfig({ params: { q: 'b' } });

    const first = registerDedupe(config);
    // 覆盖登记，map 中当前为 second
    const second = registerDedupe(config);
    // first 非当前登记，不应删除 second
    releaseDedupe(config, first);
    // 仍应取消 second
    const third = registerDedupe(config);

    expect(second.signal.aborted).toBe(true);
    expect(third.signal.aborted).toBe(false);
  });

  it('不可序列化参数的请求释放时安全跳过', () => {
    const config = buildConfig({ data: new FormData() });
    const controller = registerDedupe(config);

    expect(() => releaseDedupe(config, controller)).not.toThrow();
  });
});
