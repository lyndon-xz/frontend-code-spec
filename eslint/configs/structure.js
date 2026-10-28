import checkFile from 'eslint-plugin-check-file';
import noBarrelFiles from 'eslint-plugin-no-barrel-files';

import { DEFAULT_SRC_DIR, SRC_FILE_GLOBS } from '../constants/source-globs.js';
import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    // 状态写入存储时只保留需要的字段，判据是 zustand 的 persist 调用而非任意同名函数
    files: SRC_FILE_GLOBS,
    rules: {
      'custom/zustand-persist-partialize': 'error',
    },
  },
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
    },
  },
  {
    // 公共库目录的 index 不看内容，文件存在本身就是 barrel 入口；判据是直接父目录，与离 src 多远无关
    files: [`${DEFAULT_SRC_DIR}/**/{constants,utils,types,hooks}/index.{js,jsx,ts,tsx}`],
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
    // .ts 只用具名导出。.tsx 不在这里要求默认导出：列配置这类文件含 JSX，主体不是组件
    files: [`${DEFAULT_SRC_DIR}/**/*.ts`],
    ignores: EXEMPT_GLOBS,
    rules: {
      'import-x/no-default-export': 'error',
    },
  },
  {
    /*
     * 浏览器代码不直接读构建期注入值：散落读 process.env 时，构建器只替换字面量写法，
     * 换一种读法就静默变成 undefined，且服务端专属的 Buffer/__dirname/require 会混进客户端包。
     * 收窄只允许发生在环境模块，其余文件从那里取已判定的值。
     */
    files: SRC_FILE_GLOBS,
    ignores: [
      ...EXEMPT_GLOBS,
      `${DEFAULT_SRC_DIR}/utils/environment.*`,
      `${DEFAULT_SRC_DIR}/constants/environment.*`,
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'process',
          message: '构建期注入值只在环境模块里读取，其余文件从 @/utils/environment 取值',
        },
        { name: 'Buffer', message: 'Buffer 是服务端 API，浏览器代码不引入' },
        { name: '__dirname', message: '__dirname 是服务端 API，浏览器代码不引入' },
        { name: 'require', message: '浏览器源码用 import，不用 require' },
      ],
    },
  },
];
