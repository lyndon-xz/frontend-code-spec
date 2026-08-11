import rule from '../../../rules/structure/no-barrel.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-barrel', rule, {
  valid: [
    { code: 'export * from "./x";', filename: 'src/apis/foo.ts' },
    // 普通 index 仅含自身声明，不算桶
    { code: 'export const a = 1;', filename: 'src/apis/index.ts' },
    // 判据只看直接父目录，utils 在路径上层不算公共库桶
    { code: 'export const a = 1;', filename: 'src/utils/sub/index.ts' },
    // publicLibDirs 只留 hooks 时 utils/index 不在其列
    {
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      options: [{ publicLibDirs: ['hooks'] }],
    },
    // src 根下的 index 不是公共库桶
    { code: 'export const a = 1;', filename: 'src/index.ts' },
    // srcDir 指向 app 时路径里找不到源码根，src/utils/index 不按公共库判定
    {
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      options: [{ srcDir: 'app' }],
    },
  ],
  invalid: [
    {
      // 判据是直接父目录为公共库目录，与离 src 多远无关
      code: 'export const a = 1;',
      filename: 'src/apis/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      code: 'export const a = 1;',
      filename: 'app/constants/index.ts',
      options: [{ srcDir: 'app' }],
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      code: 'export type A = string;',
      filename: 'src/types/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      code: 'export * from "./x";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noBarrelStar' }],
    },
    {
      code: 'export { x } from "./x";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
    {
      // 具名声明与重导出并存时仍报重导出
      code: 'export const a = 1;\nexport { b } from "./b";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
  ],
});
