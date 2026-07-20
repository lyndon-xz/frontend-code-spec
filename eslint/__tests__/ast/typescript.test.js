import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../ast/typescript.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('ast/typescript', rule, {
  valid: [
    {
      name: '显式赋值的枚举成员被放行',
      code: "enum Environment { Development = 'development', Production = 'production' }",
    },
    {
      name: '显式数字赋值的枚举成员被放行',
      code: 'enum Level { Low = 1, High = 2 }',
    },
  ],
  invalid: [
    {
      name: '未显式赋值的枚举成员应报错',
      code: 'enum Status { Active }',
      errors: [{ message: '禁止自动递增枚举，每个枚举成员必须显式赋值（字符串或数字）' }],
    },
    {
      name: '部分成员缺少显式赋值应报错',
      code: 'enum Status { Active = 1, Inactive }',
      errors: [{ message: '禁止自动递增枚举，每个枚举成员必须显式赋值（字符串或数字）' }],
    },
  ],
});
