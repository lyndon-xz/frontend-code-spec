import rule from '../../../rules/destructuring/hoist-module-scope-destructuring.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('hoist-module-scope-destructuring', rule, {
  valid: [
    'import { actions } from "./actions"; const { select } = actions; function C() { return select; }',
    'function C(props) { const { a } = props; return a; }',
    // 调用结果每次都可能不同，必须留在函数体内
    'import { useModel } from "./model"; function C() { const { a } = useModel(); return a; }',
    // 成员访问右侧非单一标识符，提到顶层会改变求值时机
    'import { config } from "./config"; function C() { const { a } = config.nested; return a; }',
    'function C() { const local = { a: 1 }; const { a } = local; return a; }',
    // 数组解构取的是位置而非成员，提到顶层没有意义
    'import { list } from "./list"; function C() { const [first] = list; return first; }',
    // 环境全局无定义节点，不算本模块的常量
    'function C() { const { pathname } = location; return pathname; }',
    /*
     * 可重新赋值的模块级绑定不能提：函数体内读的是调用时最新值，提到顶层读的是模块求值那一刻的初值。
     * provider 注入槽（setXxxProvider 那套）正是这个形态。
     */
    'let active = defaults; export const setActive = (next) => { active = next; }; function C() { const { a } = active; return a; }',
    'var active = defaults; function C() { const { a } = active; return a; }',
  ],
  invalid: [
    {
      code: 'import { actions } from "./actions"; function C() { const { select } = actions; return select; }',
      errors: [{ messageId: 'hoistDestructuring', data: { name: 'actions' } }],
    },
    {
      code: 'const TABLE = { a: 1 }; function C() { const { a } = TABLE; return a; }',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
    {
      code: 'import { actions } from "./actions"; const C = () => { const { select } = actions; return select; };',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
    {
      // 嵌套函数内需向上找到模块作用域才命中
      code: 'import { actions } from "./actions"; function outer() { function inner() { const { select } = actions; return select; } return inner; }',
      errors: [{ messageId: 'hoistDestructuring' }],
    },
  ],
});
