import tseslint from 'typescript-eslint';

import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

const TS_FILES = ['**/*.ts', '**/*.tsx'];

// 预设里的 base 块不带 files，不收窄就会把 TS 解析器挂到 .js 上
const strictPresets = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({ ...config, files: TS_FILES }));

export default [
  ...strictPresets,
  {
    files: TS_FILES,
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

      // 以下规则依赖类型信息（parserOptions.projectService）
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

      '@typescript-eslint/prefer-enum-initializers': 'error',
      // 拦截器透传上游的拒绝原因时只能是 unknown，与 only-throw-error 默认放行 throw unknown 同一口径
      '@typescript-eslint/prefer-promise-reject-errors': ['error', { allowThrowingUnknown: true }],
    },
  },
  {
    // 测试常用 as unknown as Mock 造桩，故从豁免列表取 glob 排除
    files: TS_FILES,
    ignores: EXEMPT_GLOBS,
    rules: {
      // assertionStyle: never 始终放行 as const
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
  {
    /*
     * 测试要造桩、断言 mock 调用参数、取 DOM 节点，这几条在测试里只会逼出无意义的类型体操；
     * 其余类型化规则在测试里照常生效。双层数组表示两个 glob 同时命中，只放宽 TS 测试文件。
     */
    files: EXEMPT_GLOBS.map((glob) => [glob, '**/*.{ts,tsx}']),
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
