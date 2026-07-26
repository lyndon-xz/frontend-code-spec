import rule from '../../../rules/structure/no-ts-default-export.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-ts-default-export', rule, {
  valid: [
    // .ts 具名导出
    { code: 'export const a = 1;', filename: 'foo.ts' },
    // .tsx 允许 default（非 .ts）
    { code: 'export default 1;', filename: 'foo.tsx' },
    // 豁免文件放行 default
    { code: 'export default 1;', filename: 'foo.test.ts' },
  ],
  invalid: [
    {
      code: 'export default 1;',
      filename: 'foo.ts',
      errors: [{ messageId: 'noDefault' }],
    },
  ],
});
