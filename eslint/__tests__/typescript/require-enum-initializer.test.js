import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/typescript/require-enum-initializer.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('require-enum-initializer', rule, {
  valid: [
    // 数字显式赋值
    'enum E { A = 1, B = 2 }',
    // 字符串显式赋值
    "enum S { A = 'a', B = 'b' }",
    // const enum 显式赋值
    'const enum C { X = 0 }',
    // 单成员显式赋值
    'enum One { Only = 1 }',
  ],
  invalid: [
    // 单个自动递增成员
    {
      code: 'enum E { A }',
      errors: [{ messageId: 'requireInitializer' }],
    },
    // 部分成员缺少初始值
    {
      code: 'enum E { A = 1, B }',
      errors: [{ messageId: 'requireInitializer' }],
    },
    // 全部成员缺少初始值，逐个报错
    {
      code: 'enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
  ],
});
