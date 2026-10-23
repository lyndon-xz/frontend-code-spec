import vitest from '@vitest/eslint-plugin';

import { toErrorLevel } from '../utils/error-level.js';
import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

// 测试 glob 从豁免清单里取出，d.ts 与 config 不是测试文件
const TEST_FILE_GLOBS = EXEMPT_GLOBS.filter(
  (glob) => glob.includes('__tests__') || glob.includes('.test.'),
);

const recommended = vitest.configs.recommended;

/** 测试文件的 vitest 用法：推荐集里的 warn 升为 error，并点名本仓要守的几条 */
export default [
  {
    files: TEST_FILE_GLOBS,
    plugins: recommended.plugins,
    rules: {
      ...toErrorLevel(recommended.rules),
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      // failJoin 内部调用 expect，汇总失败后再断言
      'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'failJoin'] }],
      'vitest/valid-title': 'error',
      'vitest/no-conditional-expect': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
    },
  },
];
