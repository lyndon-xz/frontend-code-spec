import importPlugin from 'eslint-plugin-import';

const SHARED_IMPORT_RULES = {
  // 循环依赖让模块求值顺序变成隐式契约：先求值的一方拿到的绑定还是 undefined，改动处看不出因果
  'import/no-cycle': ['error', { ignoreExternal: true }],
  // --fix 遇到默认导入与命名导入混合（import axios, { ... }）会把 type 修饰放到花括号外、产出非法语法，须手工改
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

/** 拆两个 scope 因解析条件不同：TS 要走 typescript resolver 才认得 @/ 别名与省略的扩展名，JS 用默认解析但需在此单独注册 import 插件 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    settings: {
      // flat config 下 eslint-plugin-import 拿不到 languageOptions.parser，须显式指名，否则解析 TS 失败、no-cycle 静默画不出依赖图
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
