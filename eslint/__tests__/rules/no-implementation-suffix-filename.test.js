import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/no-implementation-suffix-filename.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

const CODE = 'export const value = 1;';

ruleTester.run('no-implementation-suffix-filename', rule, {
  valid: [
    {
      name: '业务名词命名被放行',
      filename: 'src/feature/flight-detail.tsx',
      code: CODE,
    },
    {
      name: 'index 文件被放行',
      filename: 'src/feature/index.ts',
      code: CODE,
    },
    {
      name: '分层结构文件名 types 被放行',
      filename: 'src/feature/types.ts',
      code: CODE,
    },
    {
      name: '豁免文件（测试文件）被放行',
      filename: 'src/feature/flight-modal.test.ts',
      code: CODE,
    },
  ],
  invalid: [
    {
      name: '实现类后缀 -modal 应报错',
      filename: 'src/feature/flight-modal.tsx',
      code: CODE,
      errors: [
        {
          message:
            '文件名禁用实现类后缀 `-modal`，请用业务名词命名（如 flight-detail 而非 flight-modal），类型由代码自身暴露',
        },
      ],
    },
    {
      name: '纯实现构造整名 columns 应报错',
      filename: 'src/feature/columns.ts',
      code: CODE,
      errors: [
        {
          message:
            '文件名 `columns` 是纯实现构造，请改用业务领域命名（如 order-detail、review-filter），类型由代码自身暴露',
        },
      ],
    },
    {
      name: '纯实现构造整名 form-config 应报错',
      filename: 'src/feature/form-config.ts',
      code: CODE,
      errors: [
        {
          message:
            '文件名 `form-config` 是纯实现构造，请改用业务领域命名（如 order-detail、review-filter），类型由代码自身暴露',
        },
      ],
    },
  ],
});
