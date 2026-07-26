import rule from '../../../rules/destructuring/no-param-destructuring.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-param-destructuring', rule, {
  valid: [
    'function f(a, b) { return a + b; }',
    'const g = (x) => x;',
    // 函数体内解构是允许的
    'function f(props) { const { a } = props; return a; }',
    // 默认值但非解构
    'function f(a = 1) { return a; }',
    // rest 但非解构
    'function f(...args) { return args; }',
  ],
  invalid: [
    {
      code: 'function f({ a }) { return a; }',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      code: 'function f([a]) { return a; }',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // 带默认值的对象解构：({ a } = {})
      code: 'const g = ({ a } = {}) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // 带默认值的数组解构：([a] = [])
      code: 'const g = ([a] = []) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // rest 中解构：...[a]
      code: 'function f(...[a]) { return a; }',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // 函数表达式同样受约束
      code: 'const o = { m: function ({ a }) { return a; } };',
      errors: [{ messageId: 'noParamDestructure' }],
    },
  ],
});
