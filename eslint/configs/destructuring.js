import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    rules: {
      'custom/no-param-destructuring': 'error',
      'custom/hoist-module-scope-destructuring': 'error',
    },
  },
];
