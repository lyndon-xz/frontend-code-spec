import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

/** 文件名非 *.test.js，vitest 不会当成测试执行；统一用 TS parser 以覆盖 TS / JSX 用例。 */
export function createRuleTester() {
  return new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  });
}
