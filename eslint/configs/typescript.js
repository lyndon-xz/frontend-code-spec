import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 关闭原生规则，用 TS 版避免把枚举成员、类型参数误报成遮蔽
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'inline-type-imports',
        },
      ],

      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      '@typescript-eslint/no-explicit-any': 'error',

      // 只留带说明的 @ts-expect-error；ts-ignore 失效后会无声挂着
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          'minimumDescriptionLength': 10,
        },
      ],

      // 防 0 && 渲染陷阱
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          // 可空类型放行 truthiness；纯 string / number 仍禁，空串与 0 多半是合法值
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableEnum: true,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      // 以下规则依赖 parserOptions.project
      '@typescript-eslint/no-floating-promises': 'error',
      // attributes 放开：事件属性接 async 是 React 惯例
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],

      'custom/require-enum-initializer': 'error',
    },
  },
  {
    // 测试常用 as unknown as Mock 造桩，故从豁免列表取 glob 排除
    files: ['**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      // assertionStyle: never 始终放行 as const
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
];
