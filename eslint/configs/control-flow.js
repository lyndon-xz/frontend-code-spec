/** 控制流与复杂度 — 异步写法、卫语句、嵌套/分支/参数复杂度（内建 hygiene 规则一并在此配线） */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 三元表达式最多嵌套一层，超过一层需改用 if-else 或映射对象
      'no-nested-ternary': 'error',
      // catch 块禁止空实现，必须包含错误处理逻辑
      'no-empty': ['error', { allowEmptyCatch: false }],
      // 强制 Early Return，禁止 if 里面 return 之后还写 else
      'no-else-return': ['error', { allowElseIf: false }],
      // 限制代码块最大嵌套深度为 3 层，逼迫开发者使用卫语句提前返回
      'max-depth': ['error', 3],
      // 函数参数最多 3 个，超过 3 个必须使用对象传参
      'max-params': ['error', 3],

      // 禁 .then/.catch/.finally 链式调用，统一 async/await
      'custom/no-promise-chain': 'error',
    },
  },
];
