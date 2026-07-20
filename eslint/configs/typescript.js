/** TypeScript 类型系统约束 */
export default [
  {
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
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
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
    },
  },
  {
    // 类型感知的正确性规则（依赖 parserOptions.project）：把 review-code 中原本只能靠人审的
    // 业务正确性/副作用/类型收窄维度，尽可能前移为可 CI 拦截的强 lint，从源头挡住运行时错误。
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // —— 异步正确性（对应 G1.5 副作用、G5.3 async/await 统一）——
      // Promise 必须被 await / catch / void，杜绝「忘了 await」导致的丢错误、竞态、未处理拒绝
      '@typescript-eslint/no-floating-promises': 'error',
      // 禁止把返回 Promise 的函数误用在期望 void 的位置（如 onClick、条件判断），async 逻辑静默失效的高发点
      '@typescript-eslint/no-misused-promises': 'error',
      // await 的对象必须是 thenable，避免 await 一个非 Promise 值造成的误解
      '@typescript-eslint/await-thenable': 'error',
      // 标了 async 却没有 await，多为漏写或多余的 async，暴露误用
      '@typescript-eslint/require-await': 'error',
      // try/catch 中的 return await 保留，确保异常能被本地 catch 捕获
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      // —— 冗余断言（对应 T1.7）——
      // 已是目标类型仍写 as，属冗余断言，删除以免掩盖真实类型
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // switch 覆盖联合/枚举的所有分支，漏分支即报错（对应 G1.1 状态机/映射漏项）
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // —— 字符串化陷阱（避免 `${obj}` 得到 [object Object] 一类的展示 bug）——
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 禁止自动递增枚举，每个成员必须显式赋值 (AST 分离)
      'ast/typescript': 'error',
    },
  },
];
