import rule from '../../../rules/destructuring/prefer-object-destructuring.js';
import { createRuleTester } from '../../_support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('prefer-object-destructuring', rule, {
  valid: [
    // 只访问 2 个不同属性，未超默认阈值
    'function f(u) { return u.a + u.b; }',
    // 忽略的内建对象
    'function f() { return window.a + window.b + window.c; }',
    // 大写开头视为类/枚举访问
    'function f() { return User.a + User.b + User.c; }',
    // 方法调用不计入
    'function f(o) { o.a(); o.b(); o.c(); }',
    // 赋值左侧不计入
    'function f(u) { u.a = 1; u.b = 2; u.c = 3; }',
    // delete 操作不计入
    'function f(u) { delete u.a; delete u.b; delete u.c; }',
    // 计算成员访问不计入
    'function f(u, k1, k2, k3) { return u[k1] + u[k2] + u[k3]; }',
    // 通过配置额外忽略领域对象
    {
      code: 'function f() { return styles.a + styles.b + styles.c; }',
      options: [{ additionalIgnoredObjects: ['styles'] }],
    },
  ],
  invalid: [
    {
      // 访问 3 个不同属性，超过默认阈值 2
      code: 'function f(u) { return u.a + u.b + u.c; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    {
      // 同一函数作用域内跨代码块聚合统计
      code: 'function f(u, x, y) { if (x) return u.a; if (y) return u.b; return u.c; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    {
      // 超过 3 个属性时展示文案带省略号（覆盖 MAX_DISPLAY_PROPS 分支）
      code: 'function f(u) { return u.a + u.b + u.c + u.d; }',
      errors: [{ messageId: 'preferDestructuring' }],
    },
    {
      // 自定义阈值 1：访问 2 个属性即触发
      code: 'function f(u) { return u.a + u.b; }',
      options: [{ maxAccessCount: 1 }],
      errors: [{ messageId: 'preferDestructuring' }],
    },
  ],
});
