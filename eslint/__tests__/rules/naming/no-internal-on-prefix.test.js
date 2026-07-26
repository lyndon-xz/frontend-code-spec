import rule from '../../../rules/naming/no-internal-on-prefix.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-internal-on-prefix', rule, {
  valid: [
    'function saveData() {}',
    // Props 回调声明处的 on 前缀合法：接口成员不校验
    'interface Props { onClick: () => void }',
    // 配置对象里的 on 回调属性不校验
    'const props = { onClick: () => {} };',
    // 非 on 前缀的类方法
    'class C { save() {} }',
    // 计算键的类方法不校验（覆盖 computed 守卫分支）
    'class C { [onTap]() {} }',
    // 计算键的类箭头字段不校验
    'class C { [onTap] = () => {}; }',
    // on 前缀但值非函数的类字段不校验
    'class C { onData = 5; }',
  ],
  invalid: [
    {
      code: 'const onSave = () => {};',
      errors: [{ messageId: 'noInternalOn' }],
    },
    {
      code: 'function onReset() {}',
      errors: [{ messageId: 'noInternalOn' }],
    },
    {
      code: 'class C { onTap() {} }',
      errors: [{ messageId: 'noInternalOn' }],
    },
    {
      code: 'class C { onTap = () => {}; }',
      errors: [{ messageId: 'noInternalOn' }],
    },
  ],
});
