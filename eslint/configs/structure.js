import { SRC_FILE_GLOBS } from '../utils/source-layout.js';

export default [
  {
    // 依赖 src 分层与 @/ 别名，只对 src 源码成立
    files: SRC_FILE_GLOBS,
    rules: {
      'custom/import-path-boundary': 'error',
      'custom/no-barrel': 'error',
      'custom/require-tsx-default-export': 'error',
      'custom/no-ts-default-export': 'error',
    },
  },
];
