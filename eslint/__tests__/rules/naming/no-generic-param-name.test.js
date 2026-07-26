import rule from '../../../rules/naming/no-generic-param-name.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-generic-param-name', rule, {
  valid: [
    'function f(userId) { return userId; }',
    'const g = (flight) => flight;',
    'function f(...flights) { return flights; }',
    'function f(payload = {}) { return payload; }',
  ],
  invalid: [
    {
      code: 'function f(data) { return data; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'const g = (params) => params;',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      // 默认值参数
      code: 'function f(options = {}) { return options; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      // rest 参数
      code: 'function f(...callback) { return callback; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
  ],
});
