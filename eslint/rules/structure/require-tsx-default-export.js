import { isExemptFile } from '../../utils/is-exempt-file.js';

/**
 * TSX 文件必须包含 export default 导出。
 * 测试/mock/类型声明/配置文件豁免。
 */
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
        if (!filename || !filename.endsWith('.tsx') || isExemptFile(filename)) {
          return;
        }
        const hasDefault = node.body.some((stmt) => stmt.type === 'ExportDefaultDeclaration');
        if (!hasDefault) {
          context.report({ node, messageId: 'requireDefault' });
        }
      },
    };
  },
};
