import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    rules: {
      // 只放行 `x == null`：匹配 null 与 undefined，无隐式转换陷阱
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
];
