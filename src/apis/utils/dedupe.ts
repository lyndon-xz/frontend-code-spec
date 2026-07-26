import type { AxiosRequestConfig } from 'axios';

// 记录在飞行中的请求，key 为请求签名，value 为其 AbortController
const pendingRequests = new Map<string, AbortController>();

// 仅可稳定 JSON 序列化的值参与去重；FormData/Blob/File/URLSearchParams 等宿主对象不参与，
// 否则它们会被序列化成相同字符串（如 FormData → "{}"）导致不同请求被误判为同一签名
const isSerializable = (value: unknown): boolean => {
  if (value === null || typeof value !== 'object') return true;
  if (Array.isArray(value)) return true;
  return Object.getPrototypeOf(value) === Object.prototype;
};

/*
 * 生成请求签名。参数不可稳定序列化（宿主对象 / 循环引用）时返回 null，
 * 表示该请求不参与去重，避免误判碰撞。
 */
const buildRequestKey = (config: AxiosRequestConfig): string | null => {
  const { method = 'get', url = '', params, data } = config;
  if (!isSerializable(params) || !isSerializable(data)) return null;

  try {
    return `${method.toUpperCase()} ${url} ${JSON.stringify(params ?? null)} ${JSON.stringify(data ?? null)}`;
  } catch {
    return null;
  }
};

/**
 * 为请求登记去重控制器：若已有同签名请求在飞行中，先取消它再登记本次请求。
 * 返回本次请求的 AbortController；不可去重的请求仅返回控制器、不登记。
 */
export const registerDedupe = (config: AxiosRequestConfig): AbortController => {
  const controller = new AbortController();
  const key = buildRequestKey(config);
  if (key === null) return controller;

  pendingRequests.get(key)?.abort();
  pendingRequests.set(key, controller);
  return controller;
};

export const releaseDedupe = (config: AxiosRequestConfig, controller: AbortController) => {
  const key = buildRequestKey(config);
  if (key === null) return;

  // 仅当映射中仍是本次 controller 时才删除，避免误删已被新请求覆盖的登记
  if (pendingRequests.get(key) === controller) {
    pendingRequests.delete(key);
  }
};
