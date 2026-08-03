/**
 * 结构与组织 — 导入路径、barrel、导出规范。
 * 文件内的声明顺序不在此列：正确的排法是按内聚成段（一个概念的类型、常量、辅助函数与其消费者相邻），
 * 而机器只能看形态（类型 / 常量 / 函数），按形态排会主动拆散内聚段，故这条只在 review-code 里作人工契约。
 */
export default [
  {
    /*
     * 依赖 src 分层、@/ 别名或 TS 导出形态的规则，只对 src 源码成立。
     * 测试 / mock 等豁免统一由规则内部的 isExemptFile 判定，配置层不声明 ignores。
     */
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // 模块内部使用相对路径，跨模块引用使用 @/ 别名
      'custom/import-path-boundary': 'error',
      /*
       * 禁 barrel：公共库 index（父目录为 constants/utils/types/hooks，含 apis/utils 这类深层）禁文件存在，
       * 其余 index.ts(x) 禁桶导出与跨模块重导出（export * / export { x } from）
       */
      'custom/no-barrel': 'error',
      // TSX 必须有 export default 导出
      'custom/require-tsx-default-export': 'error',
      // TS（非 TSX）禁止 export default，强制具名导出
      'custom/no-ts-default-export': 'error',
    },
  },
];
