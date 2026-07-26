import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/control-flow/no-promise-chain.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-promise-chain', rule, {
  valid: [
    // 使用 async/await 而非链式调用
    'async function f() { await g(); }',
    // then 作为属性读取而非调用，不触发
    'const x = foo.then;',
    // 普通函数调用（非成员调用）放行
    'bar();',
    // 原型链方法名（toString）不应被误命中，验证 Object.hasOwn 守卫
    'obj.toString();',
    // 其它成员方法调用放行
    'promise.finally(fn);',
    // 计算成员访问非 then/catch 放行
    "obj['map']();",
  ],
  invalid: [
    // .then() 链式调用
    {
      code: 'promise.then(fn);',
      errors: [{ messageId: 'noThenChain' }],
    },
    // .catch() 链式调用
    {
      code: 'promise.catch(fn);',
      errors: [{ messageId: 'noCatchChain' }],
    },
    // then + catch 连用，按源码顺序各报一次
    {
      code: 'promise.then(a).catch(b);',
      errors: [{ messageId: 'noThenChain' }, { messageId: 'noCatchChain' }],
    },
    // 计算成员形式 obj['then']() 也应命中
    {
      code: "promise['then'](fn);",
      errors: [{ messageId: 'noThenChain' }],
    },
    // 计算成员形式 obj['catch']()
    {
      code: "promise['catch'](fn);",
      errors: [{ messageId: 'noCatchChain' }],
    },
  ],
});
