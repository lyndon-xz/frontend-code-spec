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
   * Prettier 格式化基线 — 与 code-spec 领域正交，不进领域规则集（eslint/configs 与 rules/
   * 一一对应）， 统一在仓库顶层对全部源码（JS 规则源码 + src 的 TS/TSX）配线。
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
