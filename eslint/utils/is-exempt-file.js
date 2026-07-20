// 各规则共享的豁免文件判定（测试/mock/类型声明/配置），单一来源避免各处重复导致漂移。见 review-code R1.1。
const EXEMPT_PATTERNS = ['__tests__', 'mocks/', '.test.', '.d.ts', '.config.'];

/** 判断文件是否豁免自定义规则校验（测试 / mock / 类型声明 / 配置文件） */
export function isExemptFile(filename) {
  if (!filename) return false;
  return EXEMPT_PATTERNS.some((pattern) => filename.includes(pattern));
}
