import { RuleTester } from 'eslint';

import rule from '../../ast/testing.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('ast/testing', rule, {
  valid: [
    {
      name: '明确断言被放行',
      code: 'expect(result).toBe(1);',
    },
    {
      name: 'mock 前缀的 vi.fn() 被放行',
      code: 'const mockError = vi.fn();',
    },
  ],
  invalid: [
    {
      name: 'toMatchSnapshot 应报错',
      code: 'expect(result).toMatchSnapshot();',
      errors: [{ message: '禁止使用快照测试，请使用明确的断言' }],
    },
    {
      name: 'toMatchInlineSnapshot 应报错',
      code: 'expect(result).toMatchInlineSnapshot();',
      errors: [{ message: '禁止使用快照测试，请使用明确的断言' }],
    },
    {
      name: 'done 回调应报错',
      code: 'it("case", (done) => {});',
      errors: [{ message: '禁止使用 done 回调，请使用 async/await' }],
    },
    {
      name: '无 mock 前缀的 vi.fn() 应报错',
      code: 'const send = vi.fn();',
      errors: [{ message: 'Mock 函数强制使用 mock 前缀（如 mockMessageError）' }],
    },
  ],
});
