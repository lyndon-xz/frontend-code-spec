import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/destructuring/no-param-destructuring.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-param-destructuring', rule, {
  valid: [
    // 普通具名参数
    'function f(a, b) {}',
    // 箭头函数具名参数
    'const g = (x) => x;',
    // 默认值但左侧为标识符，非解构
    'function h(a = 1) {}',
    // rest 参数为标识符，非解构
    'function r(...args) {}',
    // 函数表达式具名参数
    'const fn = function (a) { return a; };',
  ],
  invalid: [
    // 对象解构参数
    {
      code: 'function f({ a }) {}',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // 数组解构参数
    {
      code: 'function f([a]) {}',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // 箭头函数对象解构参数
    {
      code: 'const g = ({ a }) => {};',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // 带默认值的对象解构：({ a } = {})
    {
      code: 'function f({ a } = {}) {}',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // 带默认值的数组解构：([a] = [])
    {
      code: 'function f([a] = []) {}',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // rest 参数中的数组解构：...[a]
    {
      code: 'function f(...[a]) {}',
      errors: [{ messageId: 'noParamDestructure' }],
    },
    // 函数表达式对象解构参数
    {
      code: 'const fn = function ({ a }) {};',
      errors: [{ messageId: 'noParamDestructure' }],
    },
  ],
});
