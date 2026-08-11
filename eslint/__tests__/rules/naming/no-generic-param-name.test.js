import rule from '../../../rules/naming/no-generic-param-name.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('no-generic-param-name', rule, {
  valid: [
    'function f(userId) { return userId; }',
    'const g = (flight) => flight;',
    'function f(...flights) { return flights; }',
    'function f(payload = {}) { return payload; }',
    // params/options 在请求与配置场景常见，默认放行
    'const g = (params) => params;',
    'function f(options = {}) { return options; }',
    // bannedNames 整体替换默认黑名单，data 因此放行
    {
      code: 'function f(data) { return data; }',
      options: [{ bannedNames: ['callback'] }],
    },
    'class C { save(flight) { return flight; } }',
    'const api = { save(flight) { return flight; } };',
    // bannedNames 按字面量匹配，data.* 不当通配符，dataX 不命中
    {
      code: 'function f(dataX) { return dataX; }',
      options: [{ bannedNames: ['data.*'] }],
    },
    {
      code: 'function f(payload) { return payload; }',
      options: [{ bannedNames: ['data|payload'] }],
    },
    // 测试 / mock 文件豁免：桩函数用 data 作参数名合理
    { code: 'function f(data) { return data; }', filename: 'src/apis/foo.test.ts' },
    { code: 'function f(data) { return data; }', filename: 'src/__mocks__/axios.ts' },
  ],
  invalid: [
    {
      code: 'function f(data) { return data; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'function f(...callback) { return callback; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'function f(params) { return params; }',
      options: [{ bannedNames: ['data', 'callback', 'params'] }],
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'class C { save(data) { return data; } }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'const api = { save(data) { return data; } };',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'class C { save = (data) => data; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
    {
      code: 'function f(data = {}) { return data; }',
      errors: [{ messageId: 'noGenericParam' }],
    },
  ],
});
