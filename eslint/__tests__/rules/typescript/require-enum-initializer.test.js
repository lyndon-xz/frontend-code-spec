import rule from '../../../rules/typescript/require-enum-initializer.js';
import { createRuleTester } from '../../support/rule-tester.js';

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
    {
      // const enum 同样禁止自动递增
      code: 'const enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      // declare enum：环境声明也需显式取值，否则消费方拿到的是隐式序号
      code: 'declare enum E { A, B }',
      errors: [{ messageId: 'requireInitializer' }, { messageId: 'requireInitializer' }],
    },
    {
      // 命名空间内的 enum
      code: 'namespace N { export enum E { A } }',
      errors: [{ messageId: 'requireInitializer' }],
    },
  ],
});
