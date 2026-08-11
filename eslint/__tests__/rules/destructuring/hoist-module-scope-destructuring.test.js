import rule from '../../../rules/destructuring/hoist-module-scope-destructuring.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('hoist-module-scope-destructuring', rule, {
  valid: [
    // 目标形态：模块顶层解构
    'import { actions } from "./actions"; const { select } = actions; function C() { return select; }',
    // 参数不是模块级绑定
    'function C(props) { const { a } = props; return a; }',
    // 调用结果每次都可能不同，必须留在函数体内
    'import { useModel } from "./model"; function C() { const { a } = useModel(); return a; }',
    // 成员访问的右侧不是单一标识符，提上去会改变求值时机
    'import { config } from "./config"; function C() { const { a } = config.nested; return a; }',
    // 局部变量
    'function C() { const local = { a: 1 }; const { a } = local; return a; }',
    // 数组解构取的是位置而非成员，提到顶层没有意义
    'import { list } from "./list"; function C() { const [first] = list; return first; }',
    // 环境全局（无定义节点）不是本模块的常量
    'function C() { const { pathname } = location; return pathname; }',
  ],
  invalid: [
    {
      // import 进来的 actions 对象，解构该提到模块顶层
      code: 'import { actions } from "./actions"; function C() { const { select } = actions; return select; }',
      errors: [{ messageId: 'hoistDestructuring', data: { name: 'actions' } }],
    },
    {
      // 本文件顶层 const 同样是模块级绑定
      code: 'const TABLE = { a: 1 }; function C() { const { a } = TABLE; return a; }',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
    {
      // 箭头函数体内也一样
      code: 'import { actions } from "./actions"; const C = () => { const { select } = actions; return select; };',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
    {
      // 嵌套函数内：向上找到模块作用域才算命中
      code: 'import { actions } from "./actions"; function outer() { function inner() { const { select } = actions; return select; } return inner; }',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
  ],
});
