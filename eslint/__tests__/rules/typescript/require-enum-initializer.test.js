import rule from '../../../rules/typescript/require-enum-initializer.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-enum-initializer', rule, {
  valid: ['enum E { A = 1, B = 2 }', 'enum S { X = "x", Y = "y" }', 'enum Empty {}'],
  invalid: [
    {
      code: 'enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      code: 'enum E { A = 1, B }',
      errors: [{ messageId: 'requireInitializer' }],
    },
    {
      code: 'const enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      // 环境声明也需显式取值，否则消费方拿到的是隐式序号
      code: 'declare enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      code: 'namespace N { export enum E { A } }',
      errors: [{ messageId: 'requireInitializer' }],
    },
  ],
});
