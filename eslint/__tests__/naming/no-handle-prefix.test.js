import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/no-handle-prefix.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-handle-prefix', rule, {
  valid: [
    // 语义化动词命名的函数声明
    'function saveData() {}',
    // 函数型变量使用语义化命名
    'const saveData = () => {};',
    // 名词属性 handleId 非函数值，放行
    'const handleId = 123;',
    // 类中名词数据成员放行
    'class C { handleId = 42; }',
    // 对象名词属性放行
    'const obj = { handleId: 1 };',
    // handle 后非大写（handleable）不匹配前缀模式
    'function handleable() {}',
    // 计算属性键放行
    'class C { ["handleClick"]() {} }',
    // 计算标识符键的方法放行（computed 分支）
    'class C { [handleClick]() {} }',
    // 计算标识符键的箭头字段放行（computed 分支）
    'class C { [handleClick] = () => {}; }',
  ],
  invalid: [
    {
      code: 'function handleClick() {}',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      code: 'const handleSave = () => {};',
      errors: [{ messageId: 'noHandleVar' }],
    },
    {
      code: 'const handleSave = function () {};',
      errors: [{ messageId: 'noHandleVar' }],
    },
    {
      code: 'class C { handleClick() {} }',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      code: 'class C { handleClick = () => {}; }',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      code: 'const obj = { handleClick() {} };',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      code: 'const obj = { handleClick: () => {} };',
      errors: [{ messageId: 'noHandleFn' }],
    },
  ],
});
