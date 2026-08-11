import importPlugin from 'eslint-plugin-import';

// 分组顺序 + 组间空行 + 组内字母序 + 同一模块只出现一次 + 无环，两个 scope 共用同一套要求
const SHARED_IMPORT_RULES = {
  /*
   * 循环依赖把模块求值顺序变成隐式契约：环里的某个模块被先求值时，它引用的绑定还是 undefined，
   * 表现为「换个入口就崩」而改动处看不出因果。ignoreExternal 跳过 node_modules，环基本只在本仓代码之间形成。
   */
  'import/no-cycle': ['error', { ignoreExternal: true }],
  /*
   * prefer-inline 与 consistent-type-imports 的 fixStyle: inline-type-imports 同向。
   * 注意默认导入与命名导入混合时（import axios, { ... }），fixer 会把 type 修饰放到花括号外、
   * 产出非法语法，须手工改成每个成员各带 type；报错位置本身是准的，只有 --fix 的产物要复核。
   */
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

/**
 * Import 排序与依赖成环。拆两个 scope 是因为解析条件不同：TS 源码要走 typescript resolver 才认得 @/ 别名
 * 与省略的扩展名；JS 用默认解析即可，但 import 插件需在此单独注册——顶层只为 TS/TSX 注册了插件。
 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    settings: {
      /*
       * no-cycle 要顺着 import 逐个解析被依赖的文件才能画出依赖图，而 flat config 下
       * eslint-plugin-import 拿不到 languageOptions.parser（它读的是旧版 parserPath），
       * 于是解析 TS 文件失败、静默画不出环。这里显式指名 TS 该用哪个 parser 补上这一环。
       */
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
