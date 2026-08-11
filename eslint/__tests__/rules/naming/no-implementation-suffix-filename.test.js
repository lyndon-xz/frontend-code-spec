import rule from '../../../rules/naming/no-implementation-suffix-filename.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-implementation-suffix-filename', rule, {
  valid: [
    { code: 'const a = 1;', filename: 'flight-detail.ts' },
    { code: 'const a = 1;', filename: 'index.ts' },
    // 业务集合名 -list 不算实现后缀
    { code: 'const a = 1;', filename: 'review-list.ts' },
    // 分层结构文件名放行
    { code: 'const a = 1;', filename: 'constants.ts' },
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
