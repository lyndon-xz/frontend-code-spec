import rule from '../../../rules/react/no-unnecessary-arrow-wrapper.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-unnecessary-arrow-wrapper', rule, {
  valid: [
    // 直接透传，无包裹
    { code: '<button onClick={fn} />;', filename: 'C.tsx' },
    // 成员调用有 this 绑定风险，跳过
    { code: '<button onClick={() => obj.fn()} />;', filename: 'C.tsx' },
    // async 箭头跳过
    { code: '<button onClick={async () => fn()} />;', filename: 'C.tsx' },
    // 参数数量不一致，非纯透传
    { code: '<button onClick={(e) => fn(e, 1)} />;', filename: 'C.tsx' },
    // 参数名不一致，非纯透传
    { code: '<button onClick={(e) => fn(other)} />;', filename: 'C.tsx' },
    // body 非调用表达式
    { code: '<button onClick={() => { doStuff; }} />;', filename: 'C.tsx' },
    // 字符串字面量属性值（非表达式容器）
    { code: '<button type="button" />;', filename: 'C.tsx' },
    // 布尔简写属性（无属性值）
    { code: '<input disabled />;', filename: 'C.tsx' },
    // 属性值为普通标识符，非箭头函数
    { code: '<button onClick={fn} data-x={value} />;', filename: 'C.tsx' },
    // 箭头体为多条语句的代码块，不处理
    { code: '<button onClick={() => { a(); b(); }} />;', filename: 'C.tsx' },
    // 块体单条语句但非表达式/return（如 if）
    { code: '<button onClick={() => { if (x) {} }} />;', filename: 'C.tsx' },
  ],
  invalid: [
    {
      // 无参包裹只告警不 fix
      code: '<button onClick={() => fn()} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapNoArg' }],
    },
    {
      // 单参透传，可 fix
      code: '<button onClick={(e) => fn(e)} />;',
      filename: 'C.tsx',
      output: '<button onClick={fn} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
    {
      // 多参透传，可 fix
      code: '<button onClick={(a, b) => fn(a, b)} />;',
      filename: 'C.tsx',
      output: '<button onClick={fn} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
    {
      // 块体 return 调用，无参告警
      code: '<button onClick={() => { return fn(); }} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapNoArg' }],
    },
    {
      // 块体单条透传调用，可 fix
      code: '<button onClick={(e) => { fn(e); }} />;',
      filename: 'C.tsx',
      output: '<button onClick={fn} />;',
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
  ],
});
