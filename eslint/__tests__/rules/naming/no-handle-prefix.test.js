import rule from '../../../rules/naming/no-handle-prefix.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-handle-prefix', rule, {
  valid: [
    'function saveData() {}',
    // handleId 是名词变量（句柄/账号），非函数值，放行
    'const handleId = 5;',
    'const obj = { handleId: 5 };',
    'class C { handleId = 5; }',
    // 计算成员键不校验
    'const key = "handleClick"; const obj = { [key]: () => {} };',
    // 计算键的类方法不校验（覆盖 computed 守卫分支）
    'class C { [handleClick]() {} }',
    // 对象里 handle 前缀但值非函数不校验
    'const obj = { handleData: 5 };',
    // 类字段 handle 前缀但值非函数不校验
    'class C { handleData = 5; }',
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
      code: 'class C { handleClick() {} }',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      code: 'class C { handleTap = () => {}; }',
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
