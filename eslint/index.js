import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import commentStyle from './rules/comment-style.js';
import fileElementOrder from './rules/file-element-order.js';
import importPathBoundary from './rules/import-path-boundary.js';
import noImplementationSuffixFilename from './rules/no-implementation-suffix-filename.js';
import noShouldPrefix from './rules/no-should-prefix.js';
import noUnnecessaryArrowWrapper from './rules/no-unnecessary-arrow-wrapper.js';
import preferObjectDestructuring from './rules/prefer-object-destructuring.js';
import propsInterfaceNaming from './rules/props-interface-naming.js';
import statusFieldNaming from './rules/status-field-naming.js';

import astBase from './ast/base.js';
import astImport from './ast/import.js';
import astNaming from './ast/naming.js';
import astTesting from './ast/testing.js';
import astTypescript from './ast/typescript.js';

import baseConfig from './configs/base.js';
import importConfig from './configs/import.js';
import namingConfig from './configs/naming.js';
import reactConfig from './configs/react.js';
import testingConfig from './configs/testing.js';
import typescriptConfig from './configs/typescript.js';

/** 总入口 — 注册所有插件 + 组装领域配置 */
export default [
  // 插件注册 + 全局语言配置
  {
    plugins: {
      // 自研 ESLint 规则（AST Visitor 手写）
      custom: {
        rules: {
          'comment-style': commentStyle,
          'file-element-order': fileElementOrder,
          'import-path-boundary': importPathBoundary,
          'no-should-prefix': noShouldPrefix,
          'no-implementation-suffix-filename': noImplementationSuffixFilename,
          'no-unnecessary-arrow-wrapper': noUnnecessaryArrowWrapper,
          'prefer-object-destructuring': preferObjectDestructuring,
          'props-interface-naming': propsInterfaceNaming,
          'status-field-naming': statusFieldNaming,
        },
      },
      // 原子 AST 配置规则（节点级别约束）
      ast: {
        rules: {
          base: astBase,
          import: astImport,
          naming: astNaming,
          typescript: astTypescript,
          testing: astTesting,
        },
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier,
      import: importPlugin,
      react,
      'react-hooks': reactHooks,
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  /** 领域配置 */
  ...baseConfig,
  ...typescriptConfig,
  ...namingConfig,
  ...reactConfig,
  ...importConfig,
  ...testingConfig,
];
