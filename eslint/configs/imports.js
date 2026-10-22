import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';

import { DEFAULT_SRC_DIR, SRC_FILE_GLOBS } from '../utils/source-layout.js';

const SHARED_IMPORT_RULES = {
  'unicorn/prefer-node-protocol': 'error',
  'import-x/no-cycle': ['error', { ignoreExternal: true }],
  // --fix 遇到默认导入与命名导入混合时会产出非法语法，须手工改
  'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
  'import-x/order': [
    'error',
    {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'pathGroups': [
        { pattern: '@/**', group: 'internal', position: 'before' },
        { pattern: './**/*.module.scss', group: 'index', position: 'after' },
      ],
      'pathGroupsExcludedImportTypes': ['builtin'],
      'newlines-between': 'always',
      'alphabetize': {
        order: 'asc',
      },
    },
  ],
};

/** TS 要走 typescript resolver 才认得 @/ 别名，JS 用默认解析 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    settings: {
      // import-x 默认只分析 .js 依赖，不列出 TS 扩展名时 no-cycle 会跳过 .ts/.tsx 之间的循环
      'import-x/extensions': ['.ts', '.tsx', '.js'],
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ alwaysTryTypes: true, project: './tsconfig.json' }),
      ],
    },
    plugins: {
      unicorn,
    },
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
  {
    files: ['**/*.js'],
    plugins: {
      'import-x': importX,
      unicorn,
    },
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
  {
    files: SRC_FILE_GLOBS,
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: ['utils', 'constants', 'types', 'hooks', 'components', 'apis'].map(
                (dir) => `./${DEFAULT_SRC_DIR}/${dir}`,
              ),
              from: `./${DEFAULT_SRC_DIR}/pages`,
              message:
                '公共层被多个页面复用，反向依赖某个页面会把页面细节带进所有调用方：请把要共用的部分下沉到公共层，再由页面引用',
            },
          ],
        },
      ],
    },
  },
];
