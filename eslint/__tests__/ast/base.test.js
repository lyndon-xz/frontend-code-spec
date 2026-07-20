import { RuleTester } from 'eslint';

import rule from '../../ast/base.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('ast/base', rule, {
  valid: [
    {
      name: 'async/await 调用被放行',
      code: 'async function load() { await fetchData(); }',
    },
    {
      name: '函数体内解构被放行',
      code: 'function render(user) { const { name } = user; return name; }',
    },
  ],
  invalid: [
    {
      name: '.then() 链式调用应报错',
      code: 'fetchData().then(handle);',
      errors: [{ message: '禁止使用 .then() 链式调用，请统一使用 async/await' }],
    },
    {
      name: '.catch() 链式调用应报错',
      code: 'fetchData().catch(handle);',
      errors: [{ message: '禁止使用 .catch() 链式调用，请统一使用 async/await' }],
    },
    {
      name: '函数签名中解构应报错',
      code: 'function render({ name }) { return name; }',
      errors: [{ message: '禁止在函数签名中解构，请在函数体内解构' }],
    },
    {
      name: '箭头函数签名中解构应报错',
      code: 'const render = ({ name }) => name;',
      errors: [{ message: '禁止在函数签名中解构，请在函数体内解构' }],
    },
  ],
});
