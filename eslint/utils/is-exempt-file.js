import { normalizePath } from './normalize-path.js';

// 按完整路径段匹配，避免子串误判（如 my-mocks-project 不算 mocks 目录）
const EXEMPT_DIR_SEGMENTS = new Set(['__tests__', '__mocks__', 'mocks']);

// 匹配真实扩展名（含 .cts/.mts/.cjs/.mjs），避免误伤目录名或普通文件
const EXEMPT_FILENAME_PATTERNS = [
  /\.test\.[cm]?[jt]sx?$/,
  // 仅 .d.ts，不含 .d.tsx
  /\.d\.ts$/,
  /\.config\.[cm]?[jt]sx?$/,
];

/** 判断文件是否豁免自定义规则校验（测试 / mock / 类型声明 / 配置文件） */
export function isExemptFile(filename) {
  if (!filename) return false;

  const segments = normalizePath(filename).split('/');
  const basename = segments[segments.length - 1];

  // 父路径中存在豁免目录段
  if (segments.slice(0, -1).some((segment) => EXEMPT_DIR_SEGMENTS.has(segment))) {
    return true;
  }

  return EXEMPT_FILENAME_PATTERNS.some((pattern) => pattern.test(basename));
}
