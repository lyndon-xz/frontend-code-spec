/**
 * 判断响应体是否带一个数值型的信封字段。
 * 业务信封看 `code`、SSO 信封看 `returncode`，两者只差字段名，判定收敛在此。
 * 严格校验数值类型：否则 `returncode` 为 `"-100"` 这类字符串时会被误判为已命中信封。
 */
export const hasNumberField = <K extends string>(
  body: unknown,
  field: K,
): body is Record<K, number> => {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  // Record<string, unknown> 的索引签名让取值不必断言，取到的类型已是 unknown
  const fields: Record<string, unknown> = { ...body };

  return typeof fields[field] === 'number';
};
