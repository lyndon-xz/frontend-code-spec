import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import commentsConfig from './configs/comments.js';
import controlFlowConfig from './configs/control-flow.js';
import declarationConfig from './configs/declaration.js';
import destructuringConfig from './configs/destructuring.js';
import importsConfig from './configs/imports.js';
import loggingConfig from './configs/logging.js';
import namingConfig from './configs/naming.js';
import reactConfig from './configs/react.js';
import structureConfig from './configs/structure.js';
import typescriptConfig from './configs/typescript.js';
import commentStyle from './rules/comments/comment-style.js';
import noPromiseChain from './rules/control-flow/no-promise-chain.js';
import hoistModuleScopeDestructuring from './rules/destructuring/hoist-module-scope-destructuring.js';
import noParamDestructuring from './rules/destructuring/no-param-destructuring.js';
import noGenericParamName from './rules/naming/no-generic-param-name.js';
import noHandlePrefix from './rules/naming/no-handle-prefix.js';
import noImplementationSuffixFilename from './rules/naming/no-implementation-suffix-filename.js';
import noInternalOnPrefix from './rules/naming/no-internal-on-prefix.js';
import refSuffixNaming from './rules/naming/ref-suffix-naming.js';
import requireUnitSuffix from './rules/naming/require-unit-suffix.js';
import statusFieldNaming from './rules/naming/status-field-naming.js';
import noUnnecessaryArrowWrapper from './rules/react/no-unnecessary-arrow-wrapper.js';
import propsInterfaceNaming from './rules/react/props-interface-naming.js';
import importPathBoundary from './rules/structure/import-path-boundary.js';
import noBarrel from './rules/structure/no-barrel.js';
import noTsDefaultExport from './rules/structure/no-ts-default-export.js';
import requireTsxDefaultExport from './rules/structure/require-tsx-default-export.js';
import requireEnumInitializer from './rules/typescript/require-enum-initializer.js';

/*
 * 键序与上方 import 顺序一致：那一侧由 import/order 强制字典序，是唯一稳定的排序依据。
 * 新增规则的插入位置因此有唯一答案，核对「18 条是否都注册了」也能两侧对照读。
 */
const customRules = {
  'comment-style': commentStyle,
  'no-promise-chain': noPromiseChain,
  'hoist-module-scope-destructuring': hoistModuleScopeDestructuring,
  'no-param-destructuring': noParamDestructuring,
  'no-generic-param-name': noGenericParamName,
  'no-handle-prefix': noHandlePrefix,
  'no-implementation-suffix-filename': noImplementationSuffixFilename,
  'no-internal-on-prefix': noInternalOnPrefix,
  'ref-suffix-naming': refSuffixNaming,
  'require-unit-suffix': requireUnitSuffix,
  'status-field-naming': statusFieldNaming,
  'no-unnecessary-arrow-wrapper': noUnnecessaryArrowWrapper,
  'props-interface-naming': propsInterfaceNaming,
  'import-path-boundary': importPathBoundary,
  'no-barrel': noBarrel,
  'no-ts-default-export': noTsDefaultExport,
  'require-tsx-default-export': requireTsxDefaultExport,
  'require-enum-initializer': requireEnumInitializer,
};

export default [
  {
    plugins: {
      custom: { rules: customRules },
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
      'import': importPlugin,
      react,
      'react-hooks': reactHooks,
    },
  },

  // 规则源码与各类配置文件都是 Node 端 ESM
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

  ...declarationConfig,
  ...controlFlowConfig,
  ...loggingConfig,
  ...importsConfig,
  ...commentsConfig,
  ...destructuringConfig,
  ...typescriptConfig,
  ...namingConfig,
  ...reactConfig,
  ...structureConfig,
];
