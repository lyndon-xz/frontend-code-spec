import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';

import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    plugins: {
      promise,
      sonarjs,
      unicorn,
    },
    rules: {
      // strict 让 await 表达式内与构造函数里的链式调用也报；模块顶层的调用该规则不检查
      'promise/prefer-await-to-then': ['error', { strict: true }],
      // then 属性会让普通对象被 await 当成 Promise
      'unicorn/no-thenable': 'error',
      /*
       * 单语句分支也必须带大括号：省略时函数体与条件挤在同一行，加第二条语句极易漏加括号，
       * 而缩进看起来仍像在分支内。all 而非 multi-line——统一形态才不用逐处判断该不该带。
       */
      'curly': ['error', 'all'],

      'no-nested-ternary': 'error',
      // 空 catch 由 restricted-syntax 组用一条带改法的提示报，这里不再重复报
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-else-return': ['error', { allowElseIf: false }],
      // 15 是 sonar 的默认阈值：超过时拆出有名字的函数，而不是继续加分支
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-all-duplicated-branches': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/error-message': 'error',
    },
  },
];
