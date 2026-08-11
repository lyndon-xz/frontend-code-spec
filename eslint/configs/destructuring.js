/** 解构写法 — 在何处使用解构 */
export default [
  {
    // 与语言无关，规则源码与各类配置文件同样适用
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      // 禁函数签名解构，统一在函数体首部解构
      'custom/no-param-destructuring': 'error',
      // 模块级绑定（actions 对象、映射表）的解构提到模块顶层，不写在函数体内
      'custom/hoist-module-scope-destructuring': 'error',
    },
  },
];
