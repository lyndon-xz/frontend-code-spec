/** 文件内声明顺序不在此列：机器只能按形态（类型 / 常量 / 函数）排，会拆散内聚段，故只在 review-frontend-code 里作人工契约 */
export default [
  {
    // 依赖 src 分层、@/ 别名或 TS 导出形态，只对 src 源码成立；豁免统一由规则内部的 isExemptFile 判定
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'custom/import-path-boundary': 'error',
      'custom/no-barrel': 'error',
      'custom/require-tsx-default-export': 'error',
      'custom/no-ts-default-export': 'error',
    },
  },
];
