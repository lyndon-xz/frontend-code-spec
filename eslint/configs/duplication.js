import sonarjs from 'eslint-plugin-sonarjs';

import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    plugins: {
      sonarjs,
    },
    rules: {
      'sonarjs/no-identical-functions': 'error',
    },
  },
];
