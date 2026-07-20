export default {
  meta: { type: 'problem' },
  create(context) {
    const filename = context.filename || context.getFilename?.();

    return {
      Program(node) {
        if (filename && filename.endsWith('.tsx') && !filename.includes('.test.tsx')) {
          const hasDefault = node.body.some((stmt) => stmt.type === 'ExportDefaultDeclaration');
          if (!hasDefault) {
            context.report({ node, message: 'TSX文件必须包含export default导出' });
          }
        }
      },
      ExportDefaultDeclaration(node) {
        if (
          filename &&
          filename.endsWith('.ts') &&
          !filename.endsWith('.d.ts') &&
          !filename.endsWith('.config.ts') &&
          !filename.includes('.test.ts')
        ) {
          context.report({ node, message: 'TS文件中不允许使用export default导出' });
        }
      },
      ExportAllDeclaration(node) {
        const basename = filename.split('/').pop();
        if (basename === 'index.ts' || basename === 'index.tsx') {
          context.report({ node, message: '禁止使用桶导出（export * from "..."）' });
        }
      },
      ExportNamedDeclaration(node) {
        const basename = filename.split('/').pop();
        if (basename === 'index.ts' || basename === 'index.tsx') {
          if (node.source) {
            context.report({ node, message: '禁止在 index.ts 中重导出其他模块的内容' });
          }
        }
      },
    };
  },
};
