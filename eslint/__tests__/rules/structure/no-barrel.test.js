import rule from '../../../rules/structure/no-barrel.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-barrel', rule, {
  valid: [
    // 非 index 文件不受约束
    { code: 'export * from "./x";', filename: 'src/apis/foo.ts' },
    // 普通 index 仅含自身声明，非桶
    { code: 'export const a = 1;', filename: 'src/apis/index.ts' },
    // 判据只看直接父目录：sub 不是公共库目录，因此 utils 在路径上层也不算公共库桶
    { code: 'export const a = 1;', filename: 'src/utils/sub/index.ts' },
    // publicLibDirs 可收窄公共库目录，只留 hooks 时 utils/index 不在其列
    {
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      options: [{ publicLibDirs: ['hooks'] }],
    },
    // src 根下的 index 不是公共库桶
    { code: 'export const a = 1;', filename: 'src/index.ts' },
    // 源码根目录名可配：srcDir 指向 app 时路径里找不到源码根，src/utils/index 不按公共库判定
    {
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      options: [{ srcDir: 'app' }],
    },
  ],
  invalid: [
    {
      // 深层公共库 index 同样禁止存在：判据是直接父目录为公共库目录，与它离 src 多远无关
      code: 'export const a = 1;',
      filename: 'src/apis/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // srcDir 可配：app/constants/index.ts 同样按公共库判定
      code: 'export const a = 1;',
      filename: 'app/constants/index.ts',
      options: [{ srcDir: 'app' }],
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // 公共库 index 禁止存在
      code: 'export const a = 1;',
      filename: 'src/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // types 公共库同样禁文件
      code: 'export type A = string;',
      filename: 'src/types/index.ts',
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
    {
      // 同文件具名声明 + 重导出仍报重导出
      code: 'export const a = 1;\nexport { b } from "./b";',
      filename: 'src/apis/index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
  ],
});
