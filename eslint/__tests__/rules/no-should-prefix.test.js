import { RuleTester } from 'eslint';

import rule from '../../rules/no-should-prefix.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('no-should-prefix', rule, {
  valid: [
    {
      name: 'it 描述直述可观测行为',
      code: "it('无缓存时返回 null', () => {});",
    },
    {
      name: 'it.skip 描述不以 should 开头',
      code: "it.skip('执行成功', () => {});",
    },
    {
      name: 'test() 不受该规则约束',
      code: "test('should work', () => {});",
    },
    {
      name: '非 it 的成员调用被放行',
      code: "foo.bar('should x', () => {});",
    },
    {
      name: '首参非字符串被放行',
      code: 'it(123, () => {});',
    },
  ],
  invalid: [
    {
      name: 'it 描述以 should 开头应报错',
      code: "it('should return null', () => {});",
      output: "it('return null', () => {});",
      errors: [
        {
          message: 'it() 描述禁止以 "should" 开头（it 本身已表期望，直述可观测行为即可，如 "无缓存时返回 null"）',
        },
      ],
    },
    {
      name: 'it.only 描述以 should 开头应报错',
      code: "it.only('should do x', () => {});",
      output: "it.only('do x', () => {});",
      errors: [
        {
          message: 'it() 描述禁止以 "should" 开头（it 本身已表期望，直述可观测行为即可，如 "无缓存时返回 null"）',
        },
      ],
    },
  ],
});
