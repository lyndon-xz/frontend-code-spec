import promise from 'eslint-plugin-promise';

export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      promise,
    },
    rules: {
      // strict 让 await 表达式内与构造函数里的链式调用也报；模块顶层的调用该规则不检查
      'promise/prefer-await-to-then': ['error', { strict: true }],
      /*
       * 单语句分支也必须带大括号：省略时函数体与条件挤在同一行，加第二条语句极易漏加括号，
       * 而缩进看起来仍像在分支内。all 而非 multi-line——统一形态才不用逐处判断该不该带。
       */
      'curly': ['error', 'all'],

      'no-nested-ternary': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-else-return': ['error', { allowElseIf: false }],
      'max-depth': ['error', 3],
    },
  },
];
