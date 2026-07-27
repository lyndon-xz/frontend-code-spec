import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

import customConfigs from './eslint/index.js';

/**
 * 本仓库同时交付「规则集」与「请求层基础设施范式」：
 * - src/apis 是 code-spec 的一部分（axios 封装范式），也用完整自研规则集校验。
 * - eslint 下的规则源码本身用基础规则 + Prettier 校验。
 */
export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,

  /** 请求层范式 + 其它 TS/TSX：套用完整领域规则集（parserOptions.project 指向 tsconfig.json）。 */
  ...customConfigs,

  // 规则源码（JS）：语言环境
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },

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
