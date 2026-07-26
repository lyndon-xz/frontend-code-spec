import rule from '../../../rules/structure/no-component-sidecar-files.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-component-sidecar-files', rule, {
  valid: [
    // 非组件目录下的文件
    { code: 'const a = 1;', filename: '/proj/src/apis/utils.ts' },
    // 组件入口 index 放行
    { code: 'const a = 1;', filename: '/proj/src/components/flight-card/index.tsx' },
    // 非禁用名的旁路文件
    { code: 'const a = 1;', filename: '/proj/src/components/flight-card/helpers.ts' },
    // 豁免文件（测试）
    { code: 'const a = 1;', filename: '/proj/src/components/flight-card/constants.test.ts' },
  ],
  invalid: [
    {
      code: 'const a = 1;',
      filename: '/proj/src/components/flight-card/constants.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
    {
      code: 'const a = 1;',
      filename: '/proj/src/components/flight-card/utils.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
    {
      code: 'const a = 1;',
      filename: '/proj/src/components/flight-card/types.ts',
      errors: [{ messageId: 'noSidecar' }],
    },
  ],
});
