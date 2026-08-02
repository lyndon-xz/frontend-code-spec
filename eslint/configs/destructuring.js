/** 解构写法 — 在何处、何时使用解构 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 禁函数签名解构，统一在函数体首部解构
      'custom/no-param-destructuring': 'error',
    },
  },
  {
    // 测试 / mock 等豁免由规则内的 isExemptFile 统一判定，配置里不再各写一份 ignores
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // 同一对象多属性访问时强制解构；styles 等领域对象作为豁免项在此配线传入，不写进规则
      'custom/prefer-object-destructuring': [
        'error',
        { maxAccessCount: 2, additionalIgnoredObjects: ['styles'] },
      ],
    },
  },
];
