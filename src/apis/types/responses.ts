/** 业务网关响应信封，code 为 0 表示成功 */
export interface BusinessResponse<T = unknown> {
  code: number;
  /** 服务端可能不返回，消费侧须兜底 */
  message?: string;
  timestampMs?: number;
  /** 成功但无内容时不返回，消费侧归一为 null */
  data?: T;
}

/** SSO 网关响应，未登录时 returncode 为 UNAUTHORIZED_CODE 并带跳转地址 */
export interface SsoResponse {
  returncode: number;
  redirectUrl?: string;
}
