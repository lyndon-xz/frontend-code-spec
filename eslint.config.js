import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

import customConfigs from './eslint/index.js';

/**
 * 顶层组装：忽略清单、官方推荐基线、本仓规则集，以及与规则集正交的 Prettier 格式化基线。
 * 规则该在哪类文件上开启由 eslint/ 下的领域配置各自声明，此处不做任何规则配线。
 */
export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,

  ...customConfigs,

  /*
   * Prettier 格式化基线 — JS/TS/TSX 由 eslint-plugin-prettier 在 lint 中校验；
   * json/yml/md 等其它文本由 `pnpm format:check` 覆盖，避免与 ESLint 重复扫同一批文件。
   */
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
