import jsxA11y from 'eslint-plugin-jsx-a11y-x';

import { COMPONENT_FILE_GLOBS } from '../constants/source-globs.js';

/** jsx-a11y 原版的 peer 不含 ESLint 10，改用它的社区分叉 */
export default [
  {
    ...jsxA11y.configs.recommended,
    files: COMPONENT_FILE_GLOBS,
  },
];
