import { HYGIENE_RULES } from './shared-rules.js';

/** 控制流与复杂度 — 异步写法、卫语句、嵌套/分支/参数复杂度（内建 hygiene 规则一并在此配线） */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...HYGIENE_RULES,

      // 禁 .then/.catch/.finally 链式调用，统一 async/await
      'custom/no-promise-chain': 'error',
    },
  },
];
