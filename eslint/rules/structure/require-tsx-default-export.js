import { isExemptFile } from '../../utils/is-exempt-file.js';

const EXPORT_KINDS = new Set([
  'ExportDefaultDeclaration',
  'ExportNamedDeclaration',
  'ExportAllDeclaration',
]);

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'TSX 文件必须包含 export default 导出',
    },
    schema: [],
    messages: {
      requireDefault: 'TSX 文件必须包含 export default 导出',
    },
  },
  create(context) {
    const { filename } = context;

    return {
      Program(node) {
        if (!filename.endsWith('.tsx') || isExemptFile(filename)) {
          return;
        }
        // 一个导出都没有的 TSX 是应用入口，没有默认导出可谈；入口名各仓库不同，故按有无导出判定而非文件名
        const exports = node.body.filter((stmt) => EXPORT_KINDS.has(stmt.type));
        if (exports.length === 0) {
          return;
        }

        const hasDefault = exports.some((stmt) => stmt.type === 'ExportDefaultDeclaration');
        if (!hasDefault) {
          context.report({ node, messageId: 'requireDefault' });
        }
      },
    };
  },
};
