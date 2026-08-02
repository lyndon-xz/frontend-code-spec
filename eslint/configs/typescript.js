import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

/** TypeScript 类型系统约束 */
export default [
  {
    // 全部 TS/TSX 规则同处一个 scope；类型感知规则依赖 parserOptions.project，自研规则排在末尾。
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 关闭原生规则，避免与 TS 规则冲突
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        // 允许 _开头的未使用参数
        { argsIgnorePattern: '^_' },
      ],

      // 类型定义一致性
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],

      // 空值合并
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // 业务代码禁止 any，强推 unknown + 类型收窄
      '@typescript-eslint/no-explicit-any': 'error',

      // 防范 0 && 渲染陷阱，&& 左侧必须是严格的布尔值
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      /*
       * 以下为类型感知规则（依赖 parserOptions.project），把业务正确性、副作用、类型收窄前移为 CI 可拦截的 lint。
       * Promise 必须被 await / catch / void，杜绝「忘了 await」导致的丢错误、竞态、未处理拒绝
       */
      '@typescript-eslint/no-floating-promises': 'error',
      // 禁止把返回 Promise 的函数误用在期望 void 的位置（如 onClick、条件判断），async 逻辑静默失效的高发点
      '@typescript-eslint/no-misused-promises': 'error',
      // await 的对象必须是 thenable，避免 await 一个非 Promise 值造成的误解
      '@typescript-eslint/await-thenable': 'error',
      // 标了 async 却没有 await，多为漏写或多余的 async，暴露误用
      '@typescript-eslint/require-await': 'error',
      // try/catch 中的 return await 保留，确保异常能被本地 catch 捕获
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      // switch 覆盖联合/枚举的所有分支，漏分支即报错
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // 字符串化陷阱：避免 `${obj}` 得到 [object Object] 一类的展示 bug
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],

      // 自研规则：禁止自动递增枚举，每个成员必须显式赋值
      'custom/require-enum-initializer': 'error',
    },
  },
  {
    /*
     * 类型断言禁令单独一个 scope：测试等文件豁免（测试常用 `as unknown as Mock` 造桩，全量禁断言会大量误报）。
     * 第三方规则无法像自研规则那样内部调用 isExemptFile，故从同一来源取 glob 形态，口径与 isExemptFile 一致。
     */
    files: ['**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      /*
       * 禁止用 as / <T> 断言替代类型收窄（assertionStyle: never 始终放行 as const）；请用 typeof / in / 可辨识联合等收窄。
       * 已整体禁止 as（冗余断言场景亦在其中），故不再叠加 @typescript-eslint/no-unnecessary-type-assertion，避免对同一处双重报错。
       */
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
];
