/**
 * 把文件路径的反斜杠归一为正斜杠，便于跨平台按 '/' 切分与匹配。
 * @param {string} filename
 * @returns {string}
 */
export function normalizePath(filename) {
  return filename.replace(/\\/g, '/');
}
