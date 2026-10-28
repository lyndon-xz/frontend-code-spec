import unicorn from 'eslint-plugin-unicorn';

import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';
import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/prefer-string-replace-all': 'error',
    },
  },
  {
    // 测试会把待测源码放进字符串里，其中的 ${x} 不是业务代码的误用
    files: SCRIPT_FILE_GLOBS,
    ignores: EXEMPT_GLOBS,
    rules: {
      // '${x}' 写在普通引号里不会插值，运行时会原样显示
      'no-template-curly-in-string': 'error',
    },
  },
];
