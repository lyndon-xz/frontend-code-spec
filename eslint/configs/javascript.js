import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

/**
 * JS 语言层的写法与复杂度约束，与 typescript.js 的类型层约束相对。
 * 不依赖类型信息、框架或目录分层，对仓库里所有 JS / TS / TSX 一律生效。
 */
export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      // 超过一层改用 if-else 或映射对象
      'no-nested-ternary': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-else-return': ['error', { allowElseIf: false }],
      // 嵌套超过 3 层改用卫语句提前返回
      'max-depth': ['error', 3],
      // 超过 3 个参数改用对象传参
      'max-params': ['error', 3],
      /*
       * == 的隐式转换是 '' == 0 这类判断失误的源头。只放行 `x == null`——
       * 它只匹配 null 与 undefined，没有转换陷阱，比 `x === null || x === undefined` 更清晰。
       */
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      // 不重新赋值的变量必须用 const，让「会变的量」在阅读时自然凸显
      'prefer-const': 'error',
      // var 的函数作用域与提升行为与块级作用域预期不符
      'no-var': 'error',
      // 参数被换掉后，形参名与实参不再指向同一个值，调用处读不出这一层（props: false 仍允许改属性）
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    /*
     * 控制台输出单独一个 scope：测试里 console 是 spy 目标与断言对象（`expect(console.log)`），
     * 不是忘删的调试输出。第三方规则无法像自研规则那样内部调用 isExemptFile，故从同一来源取 glob。
     */
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      /*
       * 拦排查完忘了删的调试输出。warn / error 是有意的告警通道（配置冲突、降级提示），放行；
       * log / info / group 这类只在排查现场有意义，留在代码里既是噪音又会把内部数据打给用户看。
       * 控制台输出确为职责所在时用局部 eslint-disable 标注，豁免失效由 reportUnusedDisableDirectives 点名。
       */
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
