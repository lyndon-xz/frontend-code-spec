// 各规则共享的豁免文件判定（测试/mock/类型声明/配置），单一来源避免各处重复导致漂移。
import { normalizePath } from './normalize-path.js';

// 目录段豁免：测试目录与 mock 目录（含 Jest 的 __mocks__ 约定）。
// 按完整路径段匹配，避免子串误判（如 my-mocks-project 不应算作 mocks 目录）。
const EXEMPT_DIR_SEGMENTS = new Set(['__tests__', '__mocks__', 'mocks']);

// 文件名后缀豁免：测试文件 / 类型声明 / 配置文件。
// 要求命中真实扩展名（.ts/.tsx/.js/.jsx 及 .cts/.mts/.cjs/.mjs 等），避免误伤目录名或普通文件。
const EXEMPT_FILENAME_PATTERNS = [
  /\.test\.[cm]?[jt]sx?$/, // xxx.test.ts(x) / xxx.test.js
  // 仅 .d.ts 声明文件，不含 .d.tsx
  /\.d\.ts$/,
  /\.config\.[cm]?[jt]sx?$/, // xxx.config.ts(x) / xxx.config.js
];

/** 判断文件是否豁免自定义规则校验（测试 / mock / 类型声明 / 配置文件） */
export function isExemptFile(filename) {
  if (!filename) return false;

  const segments = normalizePath(filename).split('/');
  const basename = segments[segments.length - 1];

  // 目录段命中：父路径中存在豁免目录段
  if (segments.slice(0, -1).some((segment) => EXEMPT_DIR_SEGMENTS.has(segment))) {
    return true;
  }

  // 文件名后缀命中
  return EXEMPT_FILENAME_PATTERNS.some((pattern) => pattern.test(basename));
}
