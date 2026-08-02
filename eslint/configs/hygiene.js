/**
 * 写法卫生 — 复杂度与基础写法约束。
 * 这批规则与语言、框架都无关，TS 源码与规则源码（Node 端 .js）用的是同一套，故合在一个 scope 里声明。
 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx', 'eslint/**/*.js'],
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
    },
  },
];
