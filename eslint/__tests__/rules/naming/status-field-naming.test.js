import rule from '../../../rules/naming/status-field-naming.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('status-field-naming', rule, {
  valid: [
    // 合规的布尔前缀式加载状态
    'const isLoadingList = true;',
    // 合规的后缀式错误状态
    'const flightListError = null;',
    // error/loading 后接通用属性词，描述对象自身属性，放行
    "const errorMessage = '';",
    "const loadingText = '';",
    'interface State { errorCode: number }',
    // 与 loading/error 无关的命名
    'const total = 0;',
    // error 后接通用属性词的更多形态
    "const errorText = '';",
    // 计算键的对象属性不校验（覆盖 computed 守卫分支）
    'const o = { [dynamicKey]: 1 };',
    // 计算键的类字段不校验
    'class C { [dynamicKey] = 1; }',
    // 计算键的接口属性签名不校验
    'interface I { [dynamicKey]: number }',
  ],
  invalid: [
    {
      code: 'const loadingFlightList = true;',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      code: 'const errorOrder = null;',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // 对象属性
      code: 'const state = { loadingList: true };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // 接口属性签名
      code: 'interface State { errorOrder: string }',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // 类字段
      code: 'class C { errorFlightList = null; }',
      errors: [{ messageId: 'errorPrefix' }],
    },
  ],
});
