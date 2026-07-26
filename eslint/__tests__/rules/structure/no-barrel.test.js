import rule from '../../../rules/structure/no-barrel.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-barrel', rule, {
  valid: [
    // 非 index 文件不受约束
    { code: 'export * from "./x";', filename: 'src/apis/foo.ts' },
    // 普通 index 仅含自身声明，非桶
    { code: 'export const a = 1;', filename: 'src/apis/index.ts' },
    // 深层 index 非公共库（层级不匹配），且无重导出
    { code: 'export const a = 1;', filename: 'src/utils/sub/index.ts' },
  ],
  invalid: [
    {
      // 公共库 index 禁止存在
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // 普通 index 禁桶导出
      code: 'export * from "./x";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noBarrelStar' }],
    },
    {
      // 普通 index 禁跨模块重导出
      code: 'export { x } from "./x";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
  ],
});
