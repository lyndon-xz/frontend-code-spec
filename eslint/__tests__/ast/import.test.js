import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../ast/import.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('ast/import', rule, {
  valid: [
    {
      name: 'tsx 文件含 export default 被放行',
      filename: 'src/feature/button.tsx',
      code: 'const Button = () => null;\nexport default Button;',
    },
    {
      name: '测试 tsx 文件不要求 export default',
      filename: 'src/feature/button.test.tsx',
      code: 'export const value = 1;',
    },
    {
      name: 'config.ts 允许 export default',
      filename: 'src/feature/demo.config.ts',
      code: 'export default {};',
    },
    {
      name: '非 index 文件的 export * 桶导出被放行',
      filename: 'src/feature/reexport.ts',
      code: "export * from './button';",
    },
    {
      name: 'index.ts 中不含 source 的具名导出被放行',
      filename: 'src/feature/index.ts',
      code: 'export const value = 1;',
    },
  ],
  invalid: [
    {
      name: 'tsx 文件缺少 export default 应报错',
      filename: 'src/feature/button.tsx',
      code: 'export const value = 1;',
      errors: [{ message: 'TSX文件必须包含export default导出' }],
    },
    {
      name: 'ts 文件使用 export default 应报错',
      filename: 'src/feature/demo.ts',
      code: 'const value = 1;\nexport default value;',
      errors: [{ message: 'TS文件中不允许使用export default导出' }],
    },
    {
      name: 'index.ts 桶导出应报错',
      filename: 'src/feature/index.ts',
      code: "export * from './button';",
      errors: [{ message: '禁止使用桶导出（export * from "..."）' }],
    },
    {
      name: 'index.ts 重导出其他模块应报错',
      filename: 'src/feature/index.ts',
      code: "export { Button } from './button';",
      errors: [{ message: '禁止在 index.ts 中重导出其他模块的内容' }],
    },
  ],
});
