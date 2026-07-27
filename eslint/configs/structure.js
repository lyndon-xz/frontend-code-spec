/** 结构与组织 — 导入路径、文件内排列、barrel、导出规范 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      // Import 排序
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: './**/*.module.scss', group: 'index', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // 模块内部使用相对路径，跨模块引用使用 @/ 别名
      'custom/import-path-boundary': 'error',
      // 文件内代码元素排序：类型 → 常量 → 辅助函数 → 主导出
      'custom/file-element-order': 'error',
      // 叶子组件目录禁止 constants/utils/types 旁路文件
      'custom/no-component-sidecar-files': 'error',
      /*
       * 禁 barrel：公共库 index（src/{constants,utils,types,hooks}）禁文件存在，
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
