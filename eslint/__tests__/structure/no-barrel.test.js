import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/no-barrel.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-barrel', rule, {
  valid: [
    // 非 index 文件不受约束，即便含 export *
    {
      code: "export * from './x';",
      filename: 'src/utils/helpers.ts',
    },
    // 普通组件 index：只含自身声明与默认导出，无重导出
    {
      code: 'const x = 1;\nexport default function Foo() { return null; }',
      filename: 'src/components/foo/index.tsx',
    },
    // 深层 index（非公共库一层）且只含具名 export（无 source）—— 合规
    {
      code: 'const x = 1;\nexport { x };',
      filename: 'src/features/foo/index.ts',
    },
    // 公共库目录深层 index（非严格一层）不算公共库桶
    {
      code: 'export default 1;',
      filename: 'src/utils/sub/index.ts',
    },
    // 自定义 publicLibDirs 后，utils 不再是公共库，index 只含默认导出 —— 合规
    {
      code: 'export default 1;',
      filename: 'src/utils/index.ts',
      options: [{ publicLibDirs: ['services'] }],
    },
  ],
  invalid: [
    {
      // 公共库 index（src/utils/index.ts）禁止存在
      code: 'export const x = 1;',
      filename: 'src/utils/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // 公共库 hooks 的 index 同样禁止
      code: 'export const useX = () => {};',
      filename: 'src/hooks/index.ts',
      errors: [{ messageId: 'noPublicBarrel' }],
    },
    {
      // 普通 index 中的桶导出 export *
      code: "export * from './bar';",
      filename: 'src/features/foo/index.ts',
      errors: [{ messageId: 'noBarrelStar' }],
    },
    {
      // 普通 index 中的跨模块重导出 export { x } from
      code: "export { x } from './bar';",
      filename: 'src/features/foo/index.ts',
      errors: [{ messageId: 'noReexport' }],
    },
    {
      // 自定义 publicLibDirs 命中 services
      code: 'export const s = 1;',
      filename: 'src/services/index.ts',
      options: [{ publicLibDirs: ['services'] }],
      errors: [{ messageId: 'noPublicBarrel' }],
    },
  ],
});
