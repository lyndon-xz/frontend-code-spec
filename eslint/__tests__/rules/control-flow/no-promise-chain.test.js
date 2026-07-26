import rule from '../../../rules/control-flow/no-promise-chain.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-promise-chain', rule, {
  valid: [
    // async/await 写法
    'async function f() { await fetch("/x"); }',
    // 非 then/catch 的成员调用
    'arr.map((x) => x);',
    // 原型链方法名不误命中
    'obj.toString();',
    // 计算成员但非 then/catch 字面量
    'obj["map"]();',
    // 非成员调用
    'fetch("/x");',
  ],
  invalid: [
    {
      code: 'fetch("/x").then((r) => r.json());',
      errors: [{ messageId: 'noThenChain' }],
    },
    {
      code: 'fetch("/x").catch((e) => e);',
      errors: [{ messageId: 'noCatchChain' }],
    },
    {
      // 计算成员 obj['then']
      code: 'p["then"](fn);',
      errors: [{ messageId: 'noThenChain' }],
    },
    {
      // 链式 then().catch() 各报一次
      code: 'p.then(fn).catch(err);',
      errors: [{ messageId: 'noThenChain' }, { messageId: 'noCatchChain' }],
    },
  ],
});
