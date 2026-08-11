import rule from '../../../rules/control-flow/no-promise-chain.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-promise-chain', rule, {
  valid: [
    'async function f() { await fetch("/x"); }',
    'arr.map((x) => x);',
    'obj.toString();',
    'obj["map"]();',
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
      code: 'fetch("/x").finally(() => {});',
      errors: [{ messageId: 'noFinallyChain' }],
    },
    {
      // 判定取键的字面量值而非点号形态，计算成员写法同样命中
      code: 'p["then"](fn);',
      errors: [{ messageId: 'noThenChain' }],
    },
    {
      code: 'p.then(fn).catch(err).finally(done);',
      errors: [
        { messageId: 'noThenChain' },
        { messageId: 'noCatchChain' },
        { messageId: 'noFinallyChain' },
      ],
    },
  ],
});
