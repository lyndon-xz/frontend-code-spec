import path from 'node:path';

import eslintReact from '@eslint-react/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import accessibilityConfig from './configs/accessibility.js';
import commentsConfig from './configs/comments.js';
import controlFlowConfig from './configs/control-flow.js';
import declarationConfig from './configs/declaration.js';
import destructuringConfig from './configs/destructuring.js';
import importsConfig from './configs/imports.js';
import loggingConfig from './configs/logging.js';
import namingConfig from './configs/naming.js';
import reactConfig from './configs/react.js';
import restrictedSyntaxConfig from './configs/restricted-syntax.js';
import ruleAuthoringConfig from './configs/rule-authoring.js';
import securityConfig from './configs/security.js';
import structureConfig from './configs/structure.js';
import typescriptConfig from './configs/typescript.js';
import commentStyle from './rules/comments/comment-style.js';
import hoistModuleScopeDestructuring from './rules/destructuring/hoist-module-scope-destructuring.js';
import noParamDestructuring from './rules/destructuring/no-param-destructuring.js';
import noGenericParamName from './rules/naming/no-generic-param-name.js';
import noHandlePrefix from './rules/naming/no-handle-prefix.js';
import noInternalOnPrefix from './rules/naming/no-internal-on-prefix.js';
import refSuffixNaming from './rules/naming/ref-suffix-naming.js';
import requireUnitSuffix from './rules/naming/require-unit-suffix.js';
import statusFieldNaming from './rules/naming/status-field-naming.js';
import noUnnecessaryArrowWrapper from './rules/react/no-unnecessary-arrow-wrapper.js';
import propsInterfaceNaming from './rules/react/props-interface-naming.js';
import importPathBoundary from './rules/structure/import-path-boundary.js';
import requireTsxDefaultExport from './rules/structure/require-tsx-default-export.js';

/*
 * 键序与上方 import 顺序一致：那一侧由 import-x/order 强制字典序，是唯一稳定的排序依据。
 * 新增规则的插入位置因此有唯一答案，核对规则是否都注册了也能两侧对照读。
 */
const customRules = {
  'comment-style': commentStyle,
  'hoist-module-scope-destructuring': hoistModuleScopeDestructuring,
  'no-param-destructuring': noParamDestructuring,
  'no-generic-param-name': noGenericParamName,
  'no-handle-prefix': noHandlePrefix,
  'no-internal-on-prefix': noInternalOnPrefix,
  'ref-suffix-naming': refSuffixNaming,
  'require-unit-suffix': requireUnitSuffix,
  'status-field-naming': statusFieldNaming,
  'no-unnecessary-arrow-wrapper': noUnnecessaryArrowWrapper,
  'props-interface-naming': propsInterfaceNaming,
  'import-path-boundary': importPathBoundary,
  'require-tsx-default-export': requireTsxDefaultExport,
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
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        // 本文件位于 eslint/，项目根是上一级
        tsconfigRootDir: path.resolve(import.meta.dirname, '..'),
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
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'import-x': importX,
      '@eslint-react': eslintReact,
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
  ...securityConfig,
  ...accessibilityConfig,
  ...restrictedSyntaxConfig,
  ...ruleAuthoringConfig,
];
