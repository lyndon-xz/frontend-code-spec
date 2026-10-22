import checkFile from 'eslint-plugin-check-file';
import noBarrelFiles from 'eslint-plugin-no-barrel-files';

import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';
import { DEFAULT_SRC_DIR, SRC_FILE_GLOBS } from '../utils/source-layout.js';

export default [
  {
    // 依赖 src 分层与 @/ 别名，只对 src 源码成立
    files: SRC_FILE_GLOBS,
    plugins: {
      'no-barrel-files': noBarrelFiles,
    },
    rules: {
      'custom/import-path-boundary': 'error',
      // 转发导出不限于 index：任意文件写 export * 或 export { x } from 都报
      'no-barrel-files/no-barrel-files': 'error',
      'custom/require-tsx-default-export': 'error',
    },
  },
  {
    // 公共库目录的 index 不看内容，文件存在本身就是 barrel 入口；判据是直接父目录，与离 src 多远无关
    files: [`${DEFAULT_SRC_DIR}/**/{constants,utils,types,hooks}/index.{ts,tsx}`],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/no-index': [
        'error',
        { errorMessage: '禁止公共库桶文件 `{{ target }}`：请按领域文件直引，勿设 barrel' },
      ],
    },
  },
  {
    // tsx 的默认导出由 require-tsx-default-export 反向要求
    files: [`${DEFAULT_SRC_DIR}/**/*.ts`],
    ignores: EXEMPT_GLOBS,
    rules: {
      'import-x/no-default-export': 'error',
    },
  },
];
