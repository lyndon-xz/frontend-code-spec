import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 关闭原生规则，避免与 TS 规则冲突
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      // 用 TS 版而非原生版，避免把枚举成员、类型参数误报成遮蔽
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // 取值数组与由它派生的类型是一个声明的两半，拆两行后改其中一行容易漏掉另一行，故合成一行
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

      // 只留带说明的 @ts-expect-error：多余时由 tsc 的 TS2578 点名，而 ts-ignore / ts-nocheck 失效后会无声挂着
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

      // 防范 0 && 渲染陷阱
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          // 可空类型放行 truthiness：空串与 null 同样不该渲染；纯 string / number 仍禁，那时空串与 0 多半是合法值
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

      // 以下规则依赖 parserOptions.project 提供的类型信息
      '@typescript-eslint/no-floating-promises': 'error',
      // attributes 放开：事件属性接 async 函数是 React 惯例，其 Promise 本就无人 await；交给期望同步返回值的 API 才危险，由 arguments / returns 管
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
    // 类型断言禁令单独一个 scope：测试常用 `as unknown as Mock` 造桩，而第三方规则无法内部调用 isExemptFile，故从同一来源取 glob
    files: ['**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      // assertionStyle: never 始终放行 as const；冗余断言场景已含在其中，故不叠加 no-unnecessary-type-assertion
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      // 禁了 as 却放行 ! 等于留后门，两者都在声称「我比编译器知道得多」
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
];
