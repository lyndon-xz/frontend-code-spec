import rule from '../../../rules/structure/require-tsx-default-export.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-tsx-default-export', rule, {
  valid: [
    { code: 'export default function C() { return null; }', filename: 'C.tsx' },
    { code: 'export default class C {}', filename: 'C.tsx' },
    {
      code: 'export const a = 1;\nexport default function C() { return null; }',
      filename: 'C.tsx',
    },
    { code: 'export const a = 1;', filename: 'foo.ts' },
    // 测试文件豁免
    { code: 'export const a = 1;', filename: 'C.test.tsx' },
    // 应用入口无任何导出，只有挂载副作用
    {
      code: 'createRoot(document.getElementById("root")).render(<App />);',
      filename: 'main.tsx',
    },
    // 入口名不限于 main
    { code: 'mount(<App />);', filename: 'entry.tsx' },
  ],
  invalid: [
    {
      code: 'export const a = 1;',
      filename: 'C.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
    {
      code: 'export function C() { return null; }',
      filename: 'src/components/card.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
  ],
});
