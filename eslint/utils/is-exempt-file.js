import { normalizePath } from './normalize-path.js';

// 豁免判定的唯一来源：规则一律走 isExemptFile，只有无法自校验的第三方规则才用 EXEMPT_GLOBS

// 按完整路径段匹配，避免子串误判（如 my-mocks-project 不算 mocks 目录）
const EXEMPT_DIR_SEGMENTS = new Set(['__tests__', '__mocks__', 'mocks']);

// 匹配真实扩展名，避免误伤目录名或普通文件
const EXEMPT_FILENAME_PATTERNS = [/\.test\.[cm]?[jt]sx?$/, /\.d\.ts$/, /\.config\.[cm]?[jt]sx?$/];

/** 与运行时判定口径对应的 glob，供 flat config 的 ignores 使用 */
export const EXEMPT_GLOBS = [
  ...[...EXEMPT_DIR_SEGMENTS].map((segment) => `**/${segment}/**`),
  '**/*.test.*',
  '**/*.d.ts',
  '**/*.config.*',
];

/** 入参取自 context.filename：它恒为非空字符串（未提供文件名时为 `<input>`），故不设空值守卫 */
export function isExemptFile(filename) {
  const segments = normalizePath(filename).split('/');
  const basename = segments[segments.length - 1];

  if (segments.slice(0, -1).some((segment) => EXEMPT_DIR_SEGMENTS.has(segment))) {
    return true;
  }

  return EXEMPT_FILENAME_PATTERNS.some((pattern) => pattern.test(basename));
}
