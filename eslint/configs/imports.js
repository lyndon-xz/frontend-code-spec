import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';

const SHARED_IMPORT_RULES = {
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
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
  {
    files: ['**/*.js'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
];
