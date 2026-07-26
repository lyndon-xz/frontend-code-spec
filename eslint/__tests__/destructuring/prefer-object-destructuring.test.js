import tsparser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from '../../rules/destructuring/prefer-object-destructuring.js';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsparser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('prefer-object-destructuring', rule, {
  valid: [
    // 仅访问 2 个不同属性，未超过默认阈值 2
    'function f(user) { return user.name + user.age; }',
    // 重复访问同一属性只算 1 个，不触发
    'function f(user) { return user.name + user.name + user.name; }',
    // 内建全局对象被忽略
    'function f() { return window.a + window.b + window.c; }',
    // 大写开头（类/枚举）访问被忽略
    'function f() { return UserStatus.A + UserStatus.B + UserStatus.C; }',
    // 方法调用不计入统计
    'function f(arr) { arr.map(); arr.filter(); arr.forEach(); }',
    // 赋值左侧不计入统计
    'function f(user) { user.a = 1; user.b = 2; user.c = 3; }',
    // 计算成员访问不计入统计
    'function f(user) { return user[x] + user[y] + user[z]; }',
    // delete 操作数不计入统计
    'function f(user) { delete user.a; delete user.b; delete user.c; }',
    // 通过 additionalIgnoredObjects 忽略领域对象 styles
    {
      code: 'function f() { return styles.a + styles.b + styles.c; }',
      options: [{ additionalIgnoredObjects: ['styles'] }],
    },
    // 提高阈值到 3 后，3 个属性不再触发
    {
      code: 'function f(user) { return user.a + user.b + user.c; }',
      options: [{ maxAccessCount: 3 }],
    },
  ],
  invalid: [
    // 访问 3 个不同属性，超过默认阈值 2
    {
      code: 'function f(user) { return user.name + user.age + user.id; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    // 访问超过 3 个属性时展示列表带省略号（displayProps 的 '...' 分支）
    {
      code: 'function f(user) { return user.a + user.b + user.c + user.d; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    // 散落在不同块中的访问按函数作用域聚合统计
    {
      code: 'function f(user) { if (a) { return user.x; } if (b) { return user.y; } return user.z; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    // 降低阈值到 1 后，2 个属性即触发
    {
      code: 'function f(user) { return user.a + user.b; }',
      options: [{ maxAccessCount: 1 }],
      errors: [{ messageId: 'preferDestructuring' }],
    },
  ],
});
