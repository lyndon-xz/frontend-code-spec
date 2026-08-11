import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

/**
 * 放在 __tests__/support 下：既被覆盖率排除，又因文件名非 *.test.js 不会被 vitest 当成测试执行。
 * 统一用 @typescript-eslint/parser，以便规则用例覆盖 TS / JSX 语法。
 */
export function createRuleTester() {
  return new RuleTester({
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  });
}
