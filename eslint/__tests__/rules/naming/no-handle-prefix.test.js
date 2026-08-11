import rule from '../../../rules/naming/no-handle-prefix.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-handle-prefix', rule, {
  valid: [
    'function saveData() {}',
    // handleId 是名词（句柄/账号）而非函数值，放行
    'const handleId = 5;',
    'const obj = { handleId: 5 };',
    'class C { handleId = 5; }',
    'const key = "handleClick"; const obj = { [key]: () => {} };',
    // 覆盖 computed 守卫分支
    'class C { [handleClick]() {} }',
    'const obj = { handleData: 5 };',
    'class C { handleData = 5; }',
    'export default function () {}',
    'class C { "handleClick" = () => {}; }',
    'const obj = { "handleClick": () => {} };',
    'const { handleClick } = props;',
    // 测试 / mock 文件豁免：桩函数常沿用被 mock 的原名
    { code: 'const handleSubmit = () => {};', filename: 'src/apis/foo.test.ts' },
  ],
  invalid: [
    {
      code: 'function handleClick() {}',
      errors: [{ messageId: 'noHandleFn' }],
    },
    {
      // 变量声明的函数值报 noHandleVar，类字段与对象属性即使是箭头函数也报 noHandleFn
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
