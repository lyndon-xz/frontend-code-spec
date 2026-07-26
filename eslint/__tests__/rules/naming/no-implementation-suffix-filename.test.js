import rule from '../../../rules/naming/no-implementation-suffix-filename.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-implementation-suffix-filename', rule, {
  valid: [
    // 业务名词主导
    { code: 'const a = 1;', filename: 'flight-detail.ts' },
    // index 放行
    { code: 'const a = 1;', filename: 'index.ts' },
    // 业务集合名 -list 放行
    { code: 'const a = 1;', filename: 'review-list.ts' },
    // 分层结构文件名放行
    { code: 'const a = 1;', filename: 'constants.ts' },
    // 豁免文件（测试文件）
    { code: 'const a = 1;', filename: 'flight-modal.test.ts' },
  ],
  invalid: [
    {
      code: 'const a = 1;',
      filename: 'flight-modal.tsx',
      errors: [{ messageId: 'suffixForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'user-type.ts',
      errors: [{ messageId: 'suffixForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'helper-util.ts',
      errors: [{ messageId: 'suffixForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'columns.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'form-config.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
  ],
});
