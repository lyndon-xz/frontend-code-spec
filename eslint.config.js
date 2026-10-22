import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

import customConfigs from './eslint/index.js';

export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**', '.agents/tasks/**', '.worktrees/**'] },
  js.configs.recommended,

  ...customConfigs,

  // json/yml/md 等文本由 `pnpm format:check` 覆盖，不在 ESLint 重复扫
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
