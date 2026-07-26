import rule from '../../../rules/structure/require-tsx-default-export.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('require-tsx-default-export', rule, {
  valid: [
    // .tsx 含 default 导出
    { code: 'export default function C() { return null; }', filename: 'C.tsx' },
    // .ts 文件不要求 default
    { code: 'export const a = 1;', filename: 'foo.ts' },
    // 豁免文件放行
    { code: 'export const a = 1;', filename: 'C.test.tsx' },
  ],
  invalid: [
    {
      code: 'export const a = 1;',
      filename: 'C.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
  ],
});
