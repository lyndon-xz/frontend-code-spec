/** 控制流 — 异步写法 */
export default [
  {
    // 异步写法与语言无关，规则源码与各类配置文件同样适用
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      // 禁 .then/.catch/.finally 链式调用，统一 async/await
      'custom/no-promise-chain': 'error',
    },
  },
];
