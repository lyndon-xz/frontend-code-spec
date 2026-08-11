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
    // 类方法 / 对象方法的具体命名参数
    'class C { save(flight) { return flight; } }',
    'const api = { save(flight) { return flight; } };',
    // 含正则元字符时按字面量匹配：`data.*` 不该被当成通配把 dataX 也算进去
    {
      code: 'function f(dataX) { return dataX; }',
      options: [{ bannedNames: ['data.*'] }],
    },
    {
      code: 'function f(payload) { return payload; }',
      options: [{ bannedNames: ['data|payload'] }],
    },
    // 测试 / mock 文件豁免：桩函数用 data 作参数名是合理的
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
      // 可通过 bannedNames 扩展黑名单
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
