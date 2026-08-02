import rule from '../../../rules/destructuring/no-param-destructuring.js';
import { createRuleTester } from '../../support/rule-tester.js';

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
      // 解构藏在默认值（AssignmentPattern）之下，只看形参顶层类型会漏
      code: 'const g = ({ a } = {}) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      code: 'const g = ([a] = []) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // 解构藏在 rest 参数（RestElement）之下，同样要向内穿透
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
