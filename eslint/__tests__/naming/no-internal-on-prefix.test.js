import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/naming/no-internal-on-prefix.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-internal-on-prefix', rule, {
  valid: [
    // 语义化动词命名的内部函数
    'function saveData() {}',
    'const saveData = () => {};',
    // on 后非大写（online）不匹配前缀模式
    'function online() {}',
    // 对象属性上的 on 回调放行（常是 Props 回调声明）
    'const config = { onClick: () => {} };',
    // 接口成员上的 on 回调放行（Props 类型声明）
    'interface Props { onClick: () => void; }',
    // 非函数值的 on* 变量放行
    'const onList = [1, 2, 3];',
    // 类中非函数数据字段放行
    'class C { onList = []; }',
    // 计算属性方法名放行
    'class C { ["onTap"]() {} }',
    // 计算标识符键的方法放行（computed 分支）
    'class C { [onTap]() {} }',
    // 计算标识符键的箭头字段放行（computed 分支）
    'class C { [onTap] = () => {}; }',
  ],
  invalid: [
    // 函数型变量（箭头）
    {
      code: 'const onSave = () => {};',
      errors: [{ messageId: 'noInternalOn' }],
    },
    // 函数型变量（函数表达式）
    {
      code: 'const onSave = function () {};',
      errors: [{ messageId: 'noInternalOn' }],
    },
    // 函数声明
    {
      code: 'function onReset() {}',
      errors: [{ messageId: 'noInternalOn' }],
    },
    // 类方法
    {
      code: 'class C { onTap() {} }',
      errors: [{ messageId: 'noInternalOn' }],
    },
    // 类箭头字段
    {
      code: 'class C { onTap = () => {}; }',
      errors: [{ messageId: 'noInternalOn' }],
    },
  ],
});
