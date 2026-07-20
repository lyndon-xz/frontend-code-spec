/** 基础规则 — 格式化、控制流、表达式 */
export default [
  {
    rules: {
      // 通用注释风格（所有文件）
      'custom/comment-style': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 代码格式化
      'prettier/prettier': 'error',

      // 表达式与语句
      // 三元表达式最多嵌套一层，超过一层需改用 if-else 或映射对象
      'no-nested-ternary': 'error',
      // catch 块禁止空实现，必须包含错误处理逻辑
      'no-empty': ['error', { allowEmptyCatch: false }],

      // 参数与控制流
      // 函数参数最多 3 个，超过 3 个必须使用对象传参
      'max-params': ['error', 3],
      // 强制 Early Return，禁止 if 里面 return 之后还写 else
      'no-else-return': ['error', { allowElseIf: false }],
      // 限制代码块最大嵌套深度为 3 层，逼迫开发者使用卫语句提前返回
      'max-depth': ['error', 3],

      // AST 节点级别校验分离，防止与其它领域配置相互覆盖
      'ast/base': 'error',
    },
  },
];
