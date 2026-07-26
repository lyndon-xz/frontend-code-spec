import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/structure/no-ts-default-export.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-ts-default-export', rule, {
  valid: [
    // TS 文件使用具名导出 —— 合规
    {
      code: 'export const x = 1;',
      filename: 'src/utils/foo.ts',
    },
    // TSX 文件的 export default 不受本规则约束
    {
      code: 'export default function Foo() { return null; }',
      filename: 'src/components/Foo.tsx',
    },
    // 豁免文件：.config.ts 可用 export default
    {
      code: 'export default {};',
      filename: 'src/app.config.ts',
    },
    // 豁免文件：测试文件可用 export default
    {
      code: 'export default 1;',
      filename: 'src/utils/foo.test.ts',
    },
  ],
  invalid: [
    {
      // 普通 TS 文件禁止 export default
      code: 'export default 1;',
      filename: 'src/utils/foo.ts',
      errors: [{ messageId: 'noDefault' }],
    },
    {
      // TS 文件默认导出函数同样禁止
      code: 'export default function bar() {}',
      filename: 'src/utils/bar.ts',
      errors: [{ messageId: 'noDefault' }],
    },
  ],
});
