import rule from '../../../rules/structure/require-tsx-default-export.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-tsx-default-export', rule, {
  valid: [
    // .tsx 含 default 导出
    { code: 'export default function C() { return null; }', filename: 'C.tsx' },
    // default 类组件
    { code: 'export default class C {}', filename: 'C.tsx' },
    // 具名 + default 并存
    {
      code: 'export const a = 1;\nexport default function C() { return null; }',
      filename: 'C.tsx',
    },
    // .ts 文件不要求 default
    { code: 'export const a = 1;', filename: 'foo.ts' },
    // 豁免文件放行
    { code: 'export const a = 1;', filename: 'C.test.tsx' },
    // 应用入口：无任何导出，只有挂载副作用
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
      // 仅有具名导出函数也不算 default
      code: 'export function C() { return null; }',
      filename: 'src/components/card.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
  ],
});
