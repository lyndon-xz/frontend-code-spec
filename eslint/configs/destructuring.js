/** 解构写法 — 在何处使用解构 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 禁函数签名解构，统一在函数体首部解构
      'custom/no-param-destructuring': 'error',
    },
  },
];
