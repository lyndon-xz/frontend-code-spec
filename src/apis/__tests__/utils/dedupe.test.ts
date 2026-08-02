import { describe, expect, it } from 'vitest';

import type { DedupeRequest } from '@/apis/utils/dedupe';
import { registerDedupe } from '@/apis/utils/dedupe';

// 每个用例用独立 url 生成唯一签名，隔离模块级 pendingRequests 的跨用例状态
let seq = 0;
const buildRequest = (overrides: Partial<DedupeRequest> = {}): DedupeRequest => {
  seq += 1;
  return { serviceCode: 'svc', method: 'get', url: `/dedupe/${seq}`, ...overrides };
};

describe('registerDedupe', () => {
  it('返回未取消的 signal 与可调用的 release', () => {
    const handle = registerDedupe(buildRequest());

    expect(handle.signal.aborted).toBe(false);
    expect(() => handle.release()).not.toThrow();
  });

  it('同签名请求再次登记时取消上一次在飞行中的请求', () => {
    const request = buildRequest({ params: { page: 1 } });

    const first = registerDedupe(request);
    const second = registerDedupe(request);

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('不同签名的请求互不影响', () => {
    const first = registerDedupe(buildRequest({ params: { page: 1 } }));
    const second = registerDedupe(buildRequest({ params: { page: 2 } }));

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('不同 serviceCode 的同路径请求互不取消', () => {
    const first = registerDedupe({ serviceCode: 'svc-a', method: 'get', url: '/shared' });
    const second = registerDedupe({ serviceCode: 'svc-b', method: 'get', url: '/shared' });

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('参数为数组时参与去重', () => {
    const request = buildRequest({ params: [1, 2] });

    const first = registerDedupe(request);
    const second = registerDedupe(request);

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it('参数为不可序列化的宿主对象时不参与去重', () => {
    const formData = new FormData();
    const request = buildRequest({ data: formData });

    const first = registerDedupe(request);
    const second = registerDedupe(request);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('参数存在循环引用无法序列化时不参与去重', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const request = buildRequest({ params: circular });

    const first = registerDedupe(request);
    const second = registerDedupe(request);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });
});

describe('DedupeHandle.release', () => {
  it('释放后同签名请求重新登记不会取消已释放的控制器', () => {
    const request = buildRequest({ params: { q: 'a' } });

    const first = registerDedupe(request);
    first.release();
    const second = registerDedupe(request);

    expect(first.signal.aborted).toBe(false);
    expect(second.signal.aborted).toBe(false);
  });

  it('已被新请求覆盖登记后，旧句柄的 release 不误删新登记', () => {
    const request = buildRequest({ params: { q: 'b' } });

    const first = registerDedupe(request);
    // 覆盖登记，map 中当前为 second
    const second = registerDedupe(request);
    // first 非当前登记，release 不应删除 second
    first.release();
    // 仍应取消 second
    const third = registerDedupe(request);

    expect(second.signal.aborted).toBe(true);
    expect(third.signal.aborted).toBe(false);
  });

  it('不可序列化参数的请求释放时安全跳过', () => {
    const handle = registerDedupe(buildRequest({ data: new FormData() }));

    expect(() => handle.release()).not.toThrow();
  });
});
