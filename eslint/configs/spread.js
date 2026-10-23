import unicorn from 'eslint-plugin-unicorn';

import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/no-useless-spread': 'error',
    },
  },
];
