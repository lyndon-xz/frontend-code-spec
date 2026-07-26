import rule from '../../../rules/typescript/require-enum-initializer.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-enum-initializer', rule, {
  valid: [
    'enum E { A = 1, B = 2 }',
    'enum S { X = "x", Y = "y" }',
    // 无成员的空枚举
    'enum Empty {}',
  ],
  invalid: [
    {
      code: 'enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      // 部分成员缺初始值：仅未赋值的成员报错
      code: 'enum E { A = 1, B }',
      errors: [{ messageId: 'requireInitializer' }],
    },
  ],
});
