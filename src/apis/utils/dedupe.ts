import type { Method } from 'axios';

/** 去重标识：同一服务下 method + url + 参数完全相同才算同一请求 */
export interface DedupeRequest {
  /** 必须并入签名，否则不同服务的同名接口会跨服务误取消 */
  serviceCode: string;
  method: Method;
  url: string;
  params?: unknown;
  data?: unknown;
}

/** release 复用登记时算出的 key，避免两处各自重算签名口径漂移 */
export interface DedupeHandle {
  signal: AbortSignal;
  release: () => void;
}

const pendingRequests = new Map<string, AbortController>();

// FormData/Blob 等序列化成 "{}"，参与签名会导致不同请求被误判相同
const isSerializable = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) return true;
  return Object.getPrototypeOf(value) === Object.prototype;
};

// 参数不可稳定序列化时返回 null，表示该请求不参与去重
const buildRequestKey = (request: DedupeRequest): string | null => {
  const { serviceCode, method, url, params, data } = request;
  if (!isSerializable(params) || !isSerializable(data)) return null;

  try {
    return `${serviceCode} ${method.toUpperCase()} ${url} ${JSON.stringify(params ?? null)} ${JSON.stringify(data ?? null)}`;
  } catch {
    return null;
  }
};

/** 已有同签名请求在飞行中时先取消它；不可去重的请求不进入登记表 */
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
