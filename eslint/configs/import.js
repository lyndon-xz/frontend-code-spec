/** 导入导出管控 + 模块结构 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
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
      /** 模块内部使用相对路径，跨模块引用使用 @/ 别名 */
      'custom/import-path-boundary': 'error',
      // 同一对象多属性访问时强制解构
      'custom/prefer-object-destructuring': ['error', { maxAccessCount: 2 }],
      // 文件内代码元素排序：类型 → 常量 → 辅助函数 → 主导出
      'custom/file-element-order': 'error',

      // 自定义 AST 校验 (导出规范、桶文件禁入等)
      'ast/import': 'error',
    },
  },
];
