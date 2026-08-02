import type { Method } from 'axios';

/** 参与去重的请求标识：同一服务下 method + url + 参数完全相同才算同一请求 */
export interface DedupeRequest {
  /** 服务编码：不同服务的同名接口互不相干，必须并入签名，否则会跨服务误取消 */
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
  /** 交给本次请求的取消信号 */
  signal: AbortSignal;
  /** 请求结束时注销登记 */
  release: () => void;
}

// 记录在飞行中的请求，key 为请求签名，value 为其 AbortController
const pendingRequests = new Map<string, AbortController>();

/*
 * 仅可稳定 JSON 序列化的值参与去重；FormData/Blob/File/URLSearchParams 等宿主对象不参与，
 * 否则它们会被序列化成相同字符串（如 FormData → "{}"）导致不同请求被误判为同一签名
 */
const isSerializable = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) return true;
  return Object.getPrototypeOf(value) === Object.prototype;
};

/*
 * 生成请求签名。参数不可稳定序列化（宿主对象 / 循环引用）时返回 null，
 * 表示该请求不参与去重，避免误判碰撞。
 */
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
      // 仅当映射中仍是本次 controller 时才删除，避免误删已被新请求覆盖的登记
      if (pendingRequests.get(key) === controller) {
        pendingRequests.delete(key);
      }
    },
  };
};
