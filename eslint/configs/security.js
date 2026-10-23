import noUnsanitized from 'eslint-plugin-no-unsanitized';

import { COMPONENT_FILE_GLOBS, SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';

export default [
  {
    files: SCRIPT_FILE_GLOBS,
    plugins: {
      'no-unsanitized': noUnsanitized,
    },
    rules: {
      // 字符串当代码执行；ts/tsx 另由 @typescript-eslint/no-implied-eval 拦 setTimeout('...') 一类
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      // innerHTML、insertAdjacentHTML、document.write 写入未转义内容即 XSS
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
    },
  },
  {
    files: COMPONENT_FILE_GLOBS,
    rules: {
      // 要渲染富文本时先在服务端或用净化库清洗，再走受控组件
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'error',
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'error',
    },
  },
];
