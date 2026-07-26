import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/status-field-naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('status-field-naming', rule, {
  valid: [
    // 合规的布尔前缀式加载状态
    'const isLoadingFlightList = true;',
    // 合规的后缀式错误状态
    'const flightListError = null;',
    // loading 后紧跟通用属性词（text）：描述对象自身属性，放行
    'const loadingText = "";',
    // error 后紧跟通用属性词（message）：放行
    'const errorMessage = "";',
    // 接口中 error + 通用属性词放行
    'interface State { errorMessage: string; }',
    // 对象计算属性键放行
    'const obj = { [errorFlightList]: 1 };',
    // 类计算属性键放行（PropertyDefinition computed 分支）
    'class C { [loadingUsers] = false; }',
    // 接口计算属性键放行（TSPropertySignature computed 分支）
    'interface State { [errorOrder]: string; }',
    // loading 后紧跟通用属性词（indicator）放行
    'const loadingIndicator = null;',
    // 普通业务命名放行
    'const flightList = [];',
  ],
  invalid: [
    // 变量声明：loading 前缀式
    {
      code: 'const loadingFlightList = true;',
      errors: [
        { messageId: 'loadingPrefix', data: { name: 'loadingFlightList', suffix: 'FlightList' } },
      ],
    },
    // 变量声明：error 前缀式
    {
      code: 'let errorOrder = null;',
      errors: [{ messageId: 'errorPrefix', data: { name: 'errorOrder', suggested: 'orderError' } }],
    },
    // 对象属性：loading 前缀式
    {
      code: 'const s = { loadingFlightList: true };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    // 对象属性：error 前缀式
    {
      code: 'const s = { errorOrder: "" };',
      errors: [{ messageId: 'errorPrefix' }],
    },
    // 类字段：loading 前缀式
    {
      code: 'class C { loadingUsers = false; }',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    // 接口成员：error 前缀式
    {
      code: 'interface State { errorOrder: string; }',
      errors: [{ messageId: 'errorPrefix' }],
    },
  ],
});
