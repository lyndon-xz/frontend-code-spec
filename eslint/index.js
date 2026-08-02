import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import commentsConfig from './configs/comments.js';
import controlFlowConfig from './configs/control-flow.js';
import destructuringConfig from './configs/destructuring.js';
import namingConfig from './configs/naming.js';
import reactConfig from './configs/react.js';
import structureConfig from './configs/structure.js';
import typescriptConfig from './configs/typescript.js';
import commentStyle from './rules/comments/comment-style.js';
import noPromiseChain from './rules/control-flow/no-promise-chain.js';
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
import fileElementOrder from './rules/structure/file-element-order.js';
import importPathBoundary from './rules/structure/import-path-boundary.js';
import noBarrel from './rules/structure/no-barrel.js';
import noComponentSidecarFiles from './rules/structure/no-component-sidecar-files.js';
import noDirectHttpClient from './rules/structure/no-direct-http-client.js';
import noTsDefaultExport from './rules/structure/no-ts-default-export.js';
import requireTsxDefaultExport from './rules/structure/require-tsx-default-export.js';
import requireEnumInitializer from './rules/typescript/require-enum-initializer.js';

// 规则 id 保持扁平（custom/<rule-name>），领域只体现在源码目录，不进 id。
const customRules = {
  'comment-style': commentStyle,
  'no-promise-chain': noPromiseChain,
  'no-param-destructuring': noParamDestructuring,
  'require-unit-suffix': requireUnitSuffix,
  'no-direct-http-client': noDirectHttpClient,
  'require-enum-initializer': requireEnumInitializer,
  'no-handle-prefix': noHandlePrefix,
  'no-generic-param-name': noGenericParamName,
  'ref-suffix-naming': refSuffixNaming,
  'no-internal-on-prefix': noInternalOnPrefix,
  'no-implementation-suffix-filename': noImplementationSuffixFilename,
  'status-field-naming': statusFieldNaming,
  'no-unnecessary-arrow-wrapper': noUnnecessaryArrowWrapper,
  'props-interface-naming': propsInterfaceNaming,
  'import-path-boundary': importPathBoundary,
  'no-barrel': noBarrel,
  'no-component-sidecar-files': noComponentSidecarFiles,
  'file-element-order': fileElementOrder,
  'require-tsx-default-export': requireTsxDefaultExport,
  'no-ts-default-export': noTsDefaultExport,
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
      import: importPlugin,
      react,
      'react-hooks': reactHooks,
    },
  },

  /** 领域配置（与 rules/<domain>/ 一一对应；正交的 Prettier 格式化基线在仓库顶层 eslint.config.js 配线） */
  ...commentsConfig,
  ...controlFlowConfig,
  ...destructuringConfig,
  ...typescriptConfig,
  ...namingConfig,
  ...reactConfig,
  ...structureConfig,
];
