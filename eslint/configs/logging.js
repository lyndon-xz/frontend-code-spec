import { SCRIPT_FILE_GLOBS } from '../constants/source-globs.js';
import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    // 测试里 console 是 spy 断言对象，从豁免列表取 glob 排除
    files: SCRIPT_FILE_GLOBS,
    ignores: EXEMPT_GLOBS,
    rules: {
      // warn / error 是有意的告警通道，放行；log / debug / info 会被构建剥离或被页面输出淹没
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
