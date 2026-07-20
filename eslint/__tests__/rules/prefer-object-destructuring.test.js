import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/prefer-object-destructuring.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

ruleTester.run('prefer-object-destructuring', rule, {
  valid: [
    {
      name: '访问两个属性未超过阈值',
      code: 'function f(user) { return user.name + user.age; }',
    },
    {
      name: '大写开头的类/枚举访问被忽略',
      code: 'const v = UserStatus.A + UserStatus.B + UserStatus.C;',
    },
    {
      name: '方法调用不计入属性访问',
      code: 'function f(user) { user.getName(); user.getAge(); user.getEmail(); }',
    },
    {
      name: '赋值左侧不计入属性访问',
      code: 'function f(user) { user.a = 1; user.b = 2; user.c = 3; }',
    },
    {
      name: '重复访问同一属性只算一次',
      code: 'function f(user) { return user.name + user.name + user.name; }',
    },
    {
      name: '全局/特殊对象（window）被忽略',
      code: 'function f() { return window.a + window.b + window.c; }',
    },
    {
      name: '计算成员访问（user[key]）不计入',
      code: 'function f(user) { return user[a] + user[b] + user[c]; }',
    },
    {
      name: '非标识符属性（数字索引）不计入',
      code: 'function f(user) { return user[0] + user[1] + user[2]; }',
    },
    {
      name: '链式成员访问（对象非标识符）不计入外层',
      code: 'function f(a) { return a.b.c + a.b.d + a.b.e; }',
    },
    {
      name: 'delete 操作中的成员访问不计入',
      code: 'function f(user) { delete user.a; delete user.b; delete user.c; }',
    },
  ],
  invalid: [
    {
      name: '同一对象访问三个不同属性应报错',
      code: 'function f(user) { return user.name + user.age + user.email; }',
      errors: [
        {
          message:
            '对象 `user` 的多个属性被频繁访问 (3 次: name, age, email)。请在顶部使用解构赋值 (如: const { ... } = user) 提高代码可读性。',
        },
      ],
    },
    {
      name: '自定义 maxAccessCount 为 1 时访问两个属性即报错',
      code: 'function f(user) { return user.a + user.b; }',
      options: [{ maxAccessCount: 1 }],
      errors: [
        {
          message:
            '对象 `user` 的多个属性被频繁访问 (2 次: a, b)。请在顶部使用解构赋值 (如: const { ... } = user) 提高代码可读性。',
        },
      ],
    },
    {
      name: '访问超过三个不同属性时展示前三个并追加省略号',
      code: 'function f(user) { return user.a + user.b + user.c + user.d; }',
      errors: [
        {
          message:
            '对象 `user` 的多个属性被频繁访问 (4 次: a, b, c...)。请在顶部使用解构赋值 (如: const { ... } = user) 提高代码可读性。',
        },
      ],
    },
  ],
});
