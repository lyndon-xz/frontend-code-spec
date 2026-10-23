export function toPosixPath(filename) {
  return filename.replaceAll('\\', '/');
}

// 豁免判定的唯一来源：规则走 isExemptFile，第三方规则用 EXEMPT_GLOBS

// 按完整路径段匹配，避免子串误判（my-mocks-project 不算 mocks 目录）
const EXEMPT_DIR_SEGMENTS = new Set(['__tests__', '__mocks__', 'mocks']);

/*
 * 每类豁免文件名只在此声明一次，glob 与正则两种形态都由它派生：
 * 前者给 flat config 的 ignores，后者给规则运行时判定，两者不会各自漂移。
 * 正则匹配真实扩展名，避免误伤目录名。
 */
const EXEMPT_FILENAME_KINDS = [
  { glob: '**/*.test.*', pattern: /\.test\.[cm]?[jt]sx?$/ },
  { glob: '**/*.d.ts', pattern: /\.d\.ts$/ },
  { glob: '**/*.config.*', pattern: /\.config\.[cm]?[jt]sx?$/ },
];

/** 与运行时判定口径对应的 glob，供 flat config 的 ignores 使用 */
export const EXEMPT_GLOBS = [
  ...[...EXEMPT_DIR_SEGMENTS].map((segment) => `**/${segment}/**`),
  ...EXEMPT_FILENAME_KINDS.map((kind) => kind.glob),
];

/** 入参取自 context.filename，恒为非空字符串 */
export function isExemptFile(filename) {
  const segments = toPosixPath(filename).split('/');

  if (segments.slice(0, -1).some((segment) => EXEMPT_DIR_SEGMENTS.has(segment))) {
    return true;
  }

  const basename = segments[segments.length - 1];

  return EXEMPT_FILENAME_KINDS.some((kind) => kind.pattern.test(basename));
}
