import rule from '../../../rules/react/no-unnecessary-arrow-wrapper.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-unnecessary-arrow-wrapper', rule, {
  valid: [
    { code: '<button onClick={fn} />;', filename: 'C.tsx' },
    // 成员调用有 this 绑定风险，跳过
    { code: '<button onClick={() => obj.fn()} />;', filename: 'C.tsx' },
    { code: '<button onClick={async () => fn()} />;', filename: 'C.tsx' },
    { code: '<button onClick={(e) => fn(e, 1)} />;', filename: 'C.tsx' },
    { code: '<button onClick={(e) => fn(other)} />;', filename: 'C.tsx' },
    { code: '<button onClick={() => { doStuff; }} />;', filename: 'C.tsx' },
    { code: '<button type="button" />;', filename: 'C.tsx' },
    { code: '<input disabled />;', filename: 'C.tsx' },
    { code: '<button onClick={fn} data-x={value} />;', filename: 'C.tsx' },
    { code: '<button onClick={() => { a(); b(); }} />;', filename: 'C.tsx' },
    { code: '<button onClick={() => { if (x) {} }} />;', filename: 'C.tsx' },
  ],
  invalid: [
    {
      code: '<button onClick={() => fn()} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapNoArg' }],
    },
    {
      // 只报不修：发射方可能比箭头多传实参，去掉包裹后会静默落进被调函数的可选形参
      code: '<button onClick={(e) => fn(e)} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
    {
      code: '<button onClick={(a, b) => fn(a, b)} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
    {
      code: '<button onClick={() => { return fn(); }} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapNoArg' }],
    },
    {
      code: '<button onClick={(e) => { fn(e); }} />;',
      filename: 'C.tsx',
      output: null,
      errors: [{ messageId: 'unwrapPassthrough' }],
    },
  ],
});
