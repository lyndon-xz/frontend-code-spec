import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/require-tsx-default-export.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('require-tsx-default-export', rule, {
  valid: [
    // TSX 文件包含 export default —— 合规
    {
      code: 'export default function Foo() { return null; }',
      filename: 'src/components/Foo.tsx',
    },
    // 非 TSX 文件（.ts）不要求默认导出
    {
      code: 'export const x = 1;',
      filename: 'src/utils/foo.ts',
    },
    // 豁免文件：测试 tsx 无需默认导出
    {
      code: 'export const x = 1;',
      filename: 'src/components/Foo.test.tsx',
    },
    // 豁免文件：.config.tsx 无需默认导出
    {
      code: 'export const x = 1;',
      filename: 'src/app.config.tsx',
    },
  ],
  invalid: [
    {
      // TSX 只有具名导出，缺少 export default
      code: 'export const x = 1;',
      filename: 'src/components/Foo.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
    {
      // TSX 完全没有导出
      code: 'const x = 1;',
      filename: 'src/components/Bar.tsx',
      errors: [{ messageId: 'requireDefault' }],
    },
  ],
});
