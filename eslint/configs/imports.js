import importPlugin from 'eslint-plugin-import';

// 分组顺序 + 组间空行 + 组内字母序，两个 scope 共用同一套排序要求
const IMPORT_ORDER_RULE = {
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      pathGroups: [
        { pattern: '@/**', group: 'internal', position: 'before' },
        { pattern: './**/*.module.scss', group: 'index', position: 'after' },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
      },
    },
  ],
};

/**
 * Import 排序。拆成两个 scope 的原因是解析条件不同：
 * TS 源码要走 typescript resolver 才认得 @/ 别名与省略的扩展名；
 * JS 用默认解析即可，但 import 插件需在此单独注册 —— 顶层只为 TS/TSX 注册了插件。
 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      ...IMPORT_ORDER_RULE,
    },
  },
  {
    files: ['**/*.js'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...IMPORT_ORDER_RULE,
    },
  },
];
