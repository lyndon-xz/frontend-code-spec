import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/no-component-sidecar-files.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-component-sidecar-files', rule, {
  valid: [
    // 组件 index.tsx 本体 —— 合规
    {
      code: 'export default function Foo() { return null; }',
      filename: 'src/components/Button/index.tsx',
    },
    // 组件目录下非旁路文件（styles）—— 合规
    {
      code: 'export const s = 1;',
      filename: 'src/components/Button/styles.ts',
    },
    // 不在 components 目录下的 constants.ts —— 不匹配
    {
      code: 'export const x = 1;',
      filename: 'src/utils/constants.ts',
    },
    // 组件目录更深层的 constants.ts（非直接子文件）—— 不匹配
    {
      code: 'export const x = 1;',
      filename: 'src/components/Button/parts/constants.ts',
    },
    // 豁免文件：组件目录下的 __tests__ 中的 constants.ts
    {
      code: 'export const x = 1;',
      filename: 'src/components/Button/__tests__/constants.ts',
    },
  ],
  invalid: [
    {
      // 组件目录旁路 constants.ts
      code: 'export const x = 1;',
      filename: 'src/components/Button/constants.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
    {
      // 组件目录旁路 utils.ts
      code: 'export const x = 1;',
      filename: 'src/components/Card/utils.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
    {
      // 组件目录旁路 types.ts
      code: 'export type T = number;',
      filename: 'src/components/Modal/types.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
    {
      // jsx 扩展名同样命中
      code: 'export const x = 1;',
      filename: 'src/components/Foo/utils.jsx',
      errors: [{ messageId: 'noSidecar' }],
    },
  ],
});
