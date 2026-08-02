/**
 * 与技术栈无关的规则片段（不是 flat config 数组，而是可复用的 rules 片段）：
 * 领域配置（control-flow / structure）与仓库对规则源码（Node 端 ESM 的 .js）的自校验都从这里取，
 * 保证同一条基础约束只有一处声明。
 *
 * HYGIENE_RULES 管复杂度与写法卫生：嵌套、分支、参数个数，与语言/框架无关。
 */
export const HYGIENE_RULES = {
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
  /*
   * 严格相等：== 的隐式转换是 '' == 0 这类判断失误的源头。
   * 只放行 `x == null` —— 它只匹配 null 与 undefined，没有转换陷阱，比 `x === null || x === undefined` 更清晰。
   */
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  // 不重新赋值的变量必须用 const，让「会变的量」在阅读时自然凸显
  'prefer-const': 'error',
  // var 的函数作用域与提升行为与块级作用域预期不符
  'no-var': 'error',
  /*
   * 禁止重新赋值参数本身（props: false 仍允许改属性）：
   * 参数被换掉后，形参名与实参不再指向同一个值，调用处读不出这一层。
   */
  'no-param-reassign': ['error', { props: false }],
};

/** Import 排序（分组 + 组间空行 + 组内字母序） */
export const IMPORT_ORDER_RULE = {
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      pathGroups: [
        { pattern: '@/**', group: 'internal', position: 'before' },
        { pattern: './**/*.module.scss', group: 'index', position: 'after' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
      },
    },
  ],
};
