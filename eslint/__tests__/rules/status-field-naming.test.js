import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/status-field-naming.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('status-field-naming', rule, {
  valid: [
    {
      name: '布尔前缀式 isLoadingXxx 合规',
      code: 'const isLoadingFlightList = true;',
    },
    {
      name: '后缀式 xxxError 合规',
      code: 'const flightListError = null;',
    },
    {
      name: 'loading + 通用属性词（loadingText）被放行',
      code: "const loadingText = 'x';",
    },
    {
      name: 'error + 通用属性词（errorMessage）被放行',
      code: "const errorMessage = '';",
    },
    {
      name: '计算属性名不校验',
      code: 'const s = { [loadingKey]: true };',
    },
    {
      name: '类的计算字段名不校验',
      code: 'class State { [loadingOrder] = true; }',
    },
    {
      name: '接口的计算属性名不校验',
      code: 'interface State { [errorOrder]: boolean }',
    },
  ],
  invalid: [
    {
      name: '前缀式 loadingXxx 应报错',
      code: 'const loadingFlightList = true;',
      errors: [
        {
          message:
            '异步加载状态请用布尔前缀式 `isLoadingFlightList` 而非 `loadingFlightList`，并发多流程时前缀式会互相覆盖',
        },
      ],
    },
    {
      name: '前缀式 errorXxx 应报错',
      code: 'const errorFlightList = null;',
      errors: [
        {
          message: '错误状态字段请用后缀式 `flightListError` 而非前缀式 `errorFlightList`',
        },
      ],
    },
    {
      name: '接口属性前缀式 loadingXxx 应报错',
      code: 'interface State { loadingOrder: boolean }',
      errors: [
        {
          message: '异步加载状态请用布尔前缀式 `isLoadingOrder` 而非 `loadingOrder`，并发多流程时前缀式会互相覆盖',
        },
      ],
    },
    {
      name: '对象属性前缀式 errorXxx 应报错',
      code: 'const s = { errorOrder: null };',
      errors: [
        {
          message: '错误状态字段请用后缀式 `orderError` 而非前缀式 `errorOrder`',
        },
      ],
    },
    {
      name: '类字段前缀式 loadingXxx 应报错',
      code: 'class State { loadingOrder = true; }',
      errors: [
        {
          message: '异步加载状态请用布尔前缀式 `isLoadingOrder` 而非 `loadingOrder`，并发多流程时前缀式会互相覆盖',
        },
      ],
    },
  ],
});
