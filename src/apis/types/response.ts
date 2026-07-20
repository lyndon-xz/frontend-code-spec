/** 业务响应基础结构，code、message、timestamp 必有 */
export type BusinessResponse<T = Record<string, unknown>> = {
  /** 业务状态码，0 表示成功 */
  code: number;
  /** 响应信息 */
  message: string;
  /** 响应时间戳（毫秒） */
  timestamp: number;
} & T;
