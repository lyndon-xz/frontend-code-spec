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
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          // 解构出的变量不校验布尔前缀，它们常来自外部接口 / 库
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
          // variable 选择器不覆盖类型字段，而字段才是跨模块传递的契约
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
          // 单字母是 TS 社区惯例且不会与具体类型混淆；多字母仍要 T 前缀，避免与具体类型同形
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^([A-Z]|T[A-Z][a-zA-Z0-9]*)$',
            match: true,
          },
        },
        {
          // 不禁 Type 后缀：它在业务里多半是领域词（RoomType），正则区分不了领域词与冗余命名
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
      ],
    },
  },
  {
    // 哪些文件豁免由规则内的 isExemptFile 判定（唯一来源），配置层不声明 ignores
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-handle-prefix': 'error',
      'custom/no-generic-param-name': 'error',
      'custom/no-internal-on-prefix': 'error',
    },
  },
  {
    // 依赖 React API、状态范式或业务文件命名约定，只对 src 源码成立
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'custom/ref-suffix-naming': 'error',
      'custom/no-implementation-suffix-filename': 'error',
      'custom/status-field-naming': 'error',
      // 不豁免测试：桩数据里的字段同样来自契约，单位写错的桩会把错误的预期固化下来
      'custom/require-unit-suffix': 'error',
    },
  },
];
