import rule from '../../../rules/structure/no-ts-default-export.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-ts-default-export', rule, {
  valid: [
    { code: 'export const a = 1;', filename: 'foo.ts' },
    { code: 'export const a = 1;\nexport function f() {}', filename: 'foo.ts' },
    // 规则只约束 .ts，tsx 的 default 放行
    { code: 'export default 1;', filename: 'foo.tsx' },
    // 测试文件与声明文件豁免
    { code: 'export default 1;', filename: 'foo.test.ts' },
    { code: 'export default 1;', filename: 'foo.d.ts' },
  ],
  invalid: [
    {
      code: 'export default 1;',
      filename: 'foo.ts',
      errors: [{ messageId: 'noDefault' }],
    },
    {
      code: 'const a = 1;\nexport default a;',
      filename: 'src/apis/util.ts',
      errors: [{ messageId: 'noDefault' }],
    },
  ],
});
