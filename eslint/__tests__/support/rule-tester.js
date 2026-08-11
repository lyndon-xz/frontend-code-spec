import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

/** 文件名非 *.test.js，vitest 不会当成测试执行；统一用 TS parser 以覆盖 TS / JSX 用例。 */
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
