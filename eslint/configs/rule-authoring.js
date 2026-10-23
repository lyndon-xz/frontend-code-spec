import regexp from 'eslint-plugin-regexp';

import { toErrorLevel } from '../utils/error-level.js';

const regexpPreset = regexp.configs['flat/recommended'];

/** 自研规则靠正则识别命名与路径，正则写错就是漏报或误报，只对规则源码生效 */
export default [
  {
    files: ['eslint/**/*.js'],
    plugins: regexpPreset.plugins,
    rules: toErrorLevel(regexpPreset.rules),
  },
];
