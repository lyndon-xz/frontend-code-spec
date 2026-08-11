import type { Method } from 'axios';

/** 参与去重的请求标识：同一服务下 method + url + 参数完全相同才算同一请求 */
export interface DedupeRequest {
  /** 必须并入签名，否则不同服务的同名接口会跨服务误取消 */
  serviceCode: string;
  method: Method;
  url: string;
  params?: unknown;
  data?: unknown;
}

/**
 * 去重登记句柄。签名只在登记时算一次，release 通过闭包复用同一个 key，
 * 避免登记与注销两处各自重算签名而出现口径漂移。
 */
export interface DedupeHandle {
  signal: AbortSignal;
  release: () => void;
}

const pendingRequests = new Map<string, AbortController>();

// FormData/Blob/File 等宿主对象都会序列化成 "{}"，参与签名会让不同请求被误判为同一个
const isSerializable = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) return true;
  return Object.getPrototypeOf(value) === Object.prototype;
};

// 参数不可稳定序列化（宿主对象 / 循环引用）时返回 null，表示该请求不参与去重
const buildRequestKey = (request: DedupeRequest): string | null => {
  const { serviceCode, method, url, params, data } = request;
  if (!isSerializable(params) || !isSerializable(data)) return null;

  try {
    return `${serviceCode} ${method.toUpperCase()} ${url} ${JSON.stringify(params ?? null)} ${JSON.stringify(data ?? null)}`;
  } catch {
    return null;
  }
};

/**
 * 为请求登记去重控制器：若已有同签名请求在飞行中，先取消它再登记本次请求。
 * 不可去重的请求只返回 signal 与空 release，不进入登记表。
 */
export const registerDedupe = (request: DedupeRequest): DedupeHandle => {
  const controller = new AbortController();
  const key = buildRequestKey(request);
  if (key === null) {
    return { signal: controller.signal, release: () => undefined };
  }

  pendingRequests.get(key)?.abort();
  pendingRequests.set(key, controller);

  return {
    signal: controller.signal,
    release: () => {
      // 只删自己的登记，已被新请求覆盖时不动
      if (pendingRequests.get(key) === controller) {
        pendingRequests.delete(key);
      }
    },
  };
};
