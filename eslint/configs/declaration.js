import { JS_FILE_GLOBS, SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      // props: false 只拦重新赋值参数本身，改参数对象的属性不在此列
      'no-param-reassign': ['error', { props: false }],
      'max-params': ['error', 3],
    },
  },
  {
    // ts/tsx 由 typescript 组的 @typescript-eslint/no-shadow 负责，核心版不认类型与值同名
    files: JS_FILE_GLOBS,
    rules: {
      'no-shadow': 'error',
    },
  },
];
