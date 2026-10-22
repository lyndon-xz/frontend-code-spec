import { SRC_FILE_GLOBS } from '../utils/source-layout.js';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]|Interface$',
            match: false,
          },
        },
        {
          // 解构出的变量不校验布尔前缀，常来自外部接口
          selector: 'variable',
          modifiers: ['destructured'],
          types: ['boolean'],
          format: null,
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          // variable 选择器不覆盖类型字段，字段才是跨模块传递的契约
          selector: 'typeProperty',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
        {
          // 单字母是 TS 惯例；多字母仍要 T 前缀
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^([A-Z]|T[A-Z][a-zA-Z0-9]*)$',
            match: true,
          },
        },
        {
          // 不禁 Type 后缀：业务里多半是领域词（RoomType）
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '(Interface|Alias)$',
            match: false,
          },
        },
        {
          selector: 'variable',
          types: ['array'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          custom: {
            regex: 'Array$',
            match: false,
          },
        },
        {
          selector: 'class',
          modifiers: ['abstract'],
          format: ['PascalCase'],
          custom: {
            regex: '^Abstract',
            match: true,
          },
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
        {
          // 只补 Async 后缀约束，不给函数常量引入大小写要求
          selector: 'variable',
          types: ['function'],
          format: null,
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
        {
          selector: ['classMethod', 'objectLiteralMethod', 'typeMethod'],
          format: null,
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
      ],
    },
  },
  {
    // 哪些文件豁免由规则内 isExemptFile 判定
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-handle-prefix': 'error',
      'custom/no-generic-param-name': 'error',
      'custom/no-internal-on-prefix': 'error',
    },
  },
  {
    // 依赖 React API 或业务文件命名约定，只对 src 源码成立
    files: SRC_FILE_GLOBS,
    rules: {
      'custom/ref-suffix-naming': 'error',
      'custom/no-implementation-suffix-filename': 'error',
      'custom/status-field-naming': 'error',
      'custom/require-unit-suffix': 'error',
    },
  },
];
