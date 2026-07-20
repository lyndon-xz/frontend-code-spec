/** 命名约束 — naming-convention + AST 级别命名校验 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          // 接口禁止 I 前缀（如 IUser）
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          // 解构出的变量不强制校验布尔前缀（常来自外部接口/库）
          selector: 'variable',
          modifiers: ['destructured'],
          types: ['boolean'],
          format: null,
        },
        {
          // 布尔值必须用 is/has/can/should 等语义化前缀
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'should', 'has', 'can', 'did', 'will'],
        },
        {
          // Enum 命名强制 PascalCase
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          // 泛型必须以 T 开头
          selector: 'typeParameter',
          format: ['PascalCase'],
          custom: {
            regex: '^T([A-Z][a-zA-Z0-9]*)?$',
            match: true,
          },
        },
        {
          // 禁止 Type 命名后缀
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: 'Type$',
            match: false,
          },
        },
        {
          // 数组/集合禁止 Array 类型后缀（List 作领域集合名放行，与 review-code R2.10 的 flightList 等一致）
          selector: 'variable',
          types: ['array'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          custom: {
            regex: 'Array$',
            match: false,
          },
        },
        {
          // 抽象类必须以 Abstract 前缀
          selector: 'class',
          modifiers: ['abstract'],
          format: ['PascalCase'],
          custom: {
            regex: '^Abstract',
            match: true,
          },
        },
        {
          // 禁止给函数加 Async 后缀
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          custom: {
            regex: 'Async$',
            match: false,
          },
        },
      ],

      // AST 节点级别命名校验分离，防止与其它领域配置相互覆盖
      'ast/naming': 'error',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // 文件名禁用实现类后缀（-modal/-type/-enum/-config/-util(s) 等）与纯实现整名（columns/form-config）；业务集合名如 review-list 放行
      'custom/no-implementation-suffix-filename': 'error',
      // 数据/异步状态字段强制后缀式命名（isLoadingXxx / xxxError）
      'custom/status-field-naming': 'error',
    },
  },
];
