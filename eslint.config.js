import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

import customConfigs from './eslint/index.js';

/**
 * 本仓库同时是「规则集交付物」与「规则的真实练兵场」：
 * - src 下的请求层（apis）是真实 TS 代码，用完整自研规则集校验（即规范防线的靶场）。
 * - eslint 下的规则源码本身用基础规则 + prettier 校验；行为正确性由 RuleTester 用例保证。
 */
export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,

  /** 真实 TS 练兵场：套用完整领域规则集（对 TS / TSX 文件生效，parserOptions.project 指向 tsconfig.json）。 */
  ...customConfigs,

  // 规则源码（JS）：基础校验 + 格式化
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
