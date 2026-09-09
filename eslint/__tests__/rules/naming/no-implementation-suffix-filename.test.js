import rule from '../../../rules/naming/no-implementation-suffix-filename.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-implementation-suffix-filename', rule, {
  valid: [
    { code: 'const a = 1;', filename: 'flight-detail.ts' },
    { code: 'const a = 1;', filename: 'index.ts' },
    // 业务集合名 -list 不算实现后缀
    { code: 'const a = 1;', filename: 'review-list.ts' },
    { code: 'const a = 1;', filename: 'config.ts' },
    { code: 'const a = 1;', filename: 'store.ts' },
    // 集合目录内的领域文件合法；禁的是文件名 constants.ts
    { code: 'const a = 1;', filename: 'src/constants/environment.ts' },
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
    {
      code: 'const a = 1;',
      filename: 'types.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'utils.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'helpers.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
    {
      code: 'const a = 1;',
      filename: 'constants.ts',
      errors: [{ messageId: 'exactForbidden' }],
    },
  ],
});
