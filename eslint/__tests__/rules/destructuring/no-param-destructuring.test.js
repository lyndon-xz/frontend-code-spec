import rule from '../../../rules/destructuring/no-param-destructuring.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-param-destructuring', rule, {
  valid: [
    'function f(a, b) { return a + b; }',
    'const g = (x) => x;',
    'function f(props) { const { a } = props; return a; }',
    'function f(a = 1) { return a; }',
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
      // 解构藏在 AssignmentPattern 之下，只看形参顶层类型会漏
      code: 'const g = ({ a } = {}) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      code: 'const g = ([a] = []) => a;',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      // 解构藏在 RestElement 之下，同样要向内穿透
      code: 'function f(...[a]) { return a; }',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    {
      code: 'const o = { m: function ({ a }) { return a; } };',
      errors: [{ messageId: 'noParamDestructure' }],
    },
  ],
});
