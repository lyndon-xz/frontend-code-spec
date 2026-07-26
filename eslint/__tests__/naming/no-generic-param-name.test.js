import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/no-generic-param-name.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-generic-param-name', rule, {
  valid: [
    // 具体领域词命名的普通参数
    'function load(userData) {}',
    // 箭头函数使用具体参数名
    'const load = (orderId) => {};',
    // 函数表达式使用具体参数名
    'const load = function (flightList) {};',
    // 泛化名用作普通变量（非参数）放行
    'const data = 1;',
    // 泛化名用作对象属性放行
    'const obj = { data: 1, options: 2 };',
    // 解构参数中的泛化名非直接 Identifier.params，放行
    'function load({ data }) {}',
    // rest 参数使用具体名放行
    'function load(...items) {}',
    // 默认值参数使用具体名放行
    'function load(userInfo = {}) {}',
  ],
  invalid: [
    // 普通参数 data
    {
      code: 'function load(data) {}',
      errors: [{ messageId: 'noGenericParam' }],
    },
    // 箭头函数普通参数 params
    {
      code: 'const load = (params) => {};',
      errors: [{ messageId: 'noGenericParam' }],
    },
    // 函数表达式普通参数 callback
    {
      code: 'const run = function (callback) {};',
      errors: [{ messageId: 'noGenericParam' }],
    },
    // 默认值参数 options = {}
    {
      code: 'function load(options = {}) {}',
      errors: [{ messageId: 'noGenericParam' }],
    },
    // rest 参数 ...data
    {
      code: 'function load(...data) {}',
      errors: [{ messageId: 'noGenericParam' }],
    },
    // 多个泛化参数各报一次
    {
      code: 'function load(data, params) {}',
      errors: [{ messageId: 'noGenericParam' }, { messageId: 'noGenericParam' }],
    },
  ],
});
