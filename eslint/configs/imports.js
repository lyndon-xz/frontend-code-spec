import importPlugin from 'eslint-plugin-import';

const SHARED_IMPORT_RULES = {
  'import/no-cycle': ['error', { ignoreExternal: true }],
  // --fix 遇到默认导入与命名导入混合时会产出非法语法，须手工改
  'import/no-duplicates': ['error', { 'prefer-inline': true }],
  'import/order': [
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
      // flat config 下须显式指 parser，否则 no-cycle 解析 TS 失败
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
  {
    files: ['**/*.js'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...SHARED_IMPORT_RULES,
    },
  },
];
