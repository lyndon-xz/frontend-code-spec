/**
 * 业务响应信封，code、message、timestampMs 必有，业务数据在 data 中。
 *
 * 后端存在两种响应契约，字段名不同，分别由 business / sso 拦截器处理：
 * 1. 业务网关返回 BusinessResponse，用 code 标识业务状态（0 为成功），业务数据统一放在 data 字段；
 * 2. SSO 网关返回 SsoResponse，用 returncode 标识登录态。
 */
export interface BusinessResponse<T = unknown> {
  /** 业务状态码，0 表示成功 */
  code: number;
  message: string;
  /** 响应时间戳 */
  timestampMs: number;
  data: T;
}

/** SSO 网关响应，未登录时 returncode 为未授权码并带跳转地址 */
export interface SsoResponse {
  /** 登录态返回码，未授权时为 UNAUTHORIZED_CODE */
  returncode: number;
  /** 未登录时的跳转地址 */
  redirectUrl?: string;
}
