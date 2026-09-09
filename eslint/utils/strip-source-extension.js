// 源码扩展名口径的唯一来源：`.d.ts` 要整段剥掉，否则 foo.d.ts 会留下 foo.d
const SOURCE_EXTENSION_PATTERN = /\.(d\.ts|tsx?|jsx?)$/;

/** 入参是文件名（basename），不含目录段 */
export function stripSourceExtension(basename) {
  return basename.replace(SOURCE_EXTENSION_PATTERN, '');
}
