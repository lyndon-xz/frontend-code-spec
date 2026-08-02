/** 控制流 — 异步写法 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 禁 .then/.catch/.finally 链式调用，统一 async/await
      'custom/no-promise-chain': 'error',
    },
  },
];
