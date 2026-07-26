/** 路径相关的共享工具，单一来源避免各规则各自处理 Windows 反斜杠导致行为漂移。 */

/**
 * 把文件路径的反斜杠归一为正斜杠，便于跨平台按 '/' 切分与匹配。
 * @param {string} filename
 * @returns {string}
 */
export function normalizePath(filename) {
  return filename.replace(/\\/g, '/');
}
