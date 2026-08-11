import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

/** TypeScript 类型系统约束 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 关闭原生规则，避免与 TS 规则冲突
      'no-unused-vars': 'off',
      'no-shadow': 'off',
      /*
       * 内层同名变量遮蔽外层：读代码时无法判断当前引用的是哪一个，改动时极易改错作用域。
       * 用 TS 版而非原生版，避免把枚举成员、类型参数误报成遮蔽。
       */
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      /*
       * inline-type-imports：同一模块既要值又要类型时合成一行、类型成员加行内 type 修饰。
       * 取值数组与由它派生的类型是一个声明的两半，拆两行后改其中一行容易漏掉另一行。
       */
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'inline-type-imports',
        },
      ],

      // ?? 只在 null / undefined 时回落，|| 会把 0 与空串一并当作缺值
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // 改用 unknown + 类型收窄
      '@typescript-eslint/no-explicit-any': 'error',

      /*
       * @ts-ignore 与 @ts-nocheck 一并禁掉，只留带说明的 @ts-expect-error：前两者在下方代码不再报错后
       * 毫无提示地继续挂着，而多余的 @ts-expect-error 由 tsc 的 TS2578 直接点名，
       * 「这个豁免已经不需要了」于是有了自动出口——本规则自身不检测多余指令，靠的是 type-check 那一道。
       */
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

      // 防范 0 && 渲染陷阱，&& 左侧必须是严格的布尔值
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          /*
           * 可空类型判「有没有」放行 truthiness：对文本而言空串与 null 同样不该渲染，
           * 拆成 `!== null` 反而会渲染出空节点。纯 string / number 仍然禁——
           * 那时空串与 0 多半是合法值，被 falsy 吃掉即 bug。
           */
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

      // 以下为类型感知规则（依赖 parserOptions.project），把业务正确性与副作用前移为 CI 可拦截的 lint
      '@typescript-eslint/no-floating-promises': 'error',
      /*
       * attributes 放开：`onOk={confirm}` 这类事件属性接 async 函数是 React 生态惯例，
       * 事件处理器的 Promise 本就无人 await。真正危险的是把 async 函数交给期望同步返回值的
       * API（`filter`、比较器），那由 arguments / returns 两项管。
       */
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
      // 标了 async 却没有 await，多为漏写或多余的 async
      '@typescript-eslint/require-await': 'error',
      // try/catch 中保留 return await，确保异常能被本地 catch 捕获
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // 字符串化陷阱：避免 `${obj}` 得到 [object Object] 一类的展示 bug
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],

      // 禁止自动递增枚举，每个成员显式赋值
      'custom/require-enum-initializer': 'error',
    },
  },
  {
    /*
     * 类型断言禁令单独一个 scope：测试常用 `as unknown as Mock` 造桩，全量禁断言会大量误报。
     * 第三方规则无法像自研规则那样内部调用 isExemptFile，故从同一来源取 glob 形态保持口径一致。
     */
    files: ['**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      /*
       * 禁止用断言替代类型收窄（assertionStyle: never 始终放行 as const），请用 typeof / in / 可辨识联合。
       * 冗余断言场景已含在其中，故不叠加 no-unnecessary-type-assertion，避免对同一处双重报错。
       */
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      /*
       * 非空断言与 as 是同一个口子，都在声称「我比编译器知道得多」。禁了 as 却放行 ! 等于留后门：
       * 先取值再判空，判空分支本身就是那个「你以为不会发生」的情形该走的路。
       */
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
];
