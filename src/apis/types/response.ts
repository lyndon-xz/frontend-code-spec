/** 业务网关响应信封，code 为 0 表示成功 */
export interface BusinessResponse<T = unknown> {
  code: number;
  message: string;
  timestampMs: number;
  data: T;
}

/** SSO 网关响应，未登录时 returncode 为 UNAUTHORIZED_CODE 并带跳转地址 */
export interface SsoResponse {
  returncode: number;
  redirectUrl?: string;
}
