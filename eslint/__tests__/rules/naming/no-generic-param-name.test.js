import rule from '../../../rules/naming/no-generic-param-name.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-generic-param-name', rule, {
  valid: [
    'function f(userId) { return userId; }',
    'const g = (flight) => flight;',
    'function f(...flights) { return flights; }',
    'function f(payload = {}) { return payload; }',
    // params/options 在请求与配置场景常见，默认允许
    'const g = (params) => params;',
    'function f(options = {}) { return options; }',
    // 可通过 bannedNames 收窄默认黑名单
    {
      code: 'function f(data) { return data; }',
      options: [{ bannedNames: ['callback'] }],
    },
  ],
  invalid: [
    {
      code: 'function f(data) { return data; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      // rest 参数
      code: 'function f(...callback) { return callback; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      // 可通过 bannedNames 扩展黑名单
      code: 'function f(params) { return params; }',
      options: [{ bannedNames: ['data', 'callback', 'params'] }],
      errors: [{ messageId: 'noGenericParam' }],
    },
  ],
});
