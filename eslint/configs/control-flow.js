export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-promise-chain': 'error',
      /*
       * 单语句分支也必须带大括号：省略时函数体与条件挤在同一行，加第二条语句极易漏加括号，
       * 而缩进看起来仍像在分支内。all 而非 multi-line——统一形态才不用逐处判断该不该带。
       */
      'curly': ['error', 'all'],
    },
  },
];
