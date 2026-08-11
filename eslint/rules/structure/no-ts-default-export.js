import { isExemptFile } from '../../utils/is-exempt-file.js';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'TS 文件（非 TSX）中不允许使用 export default 导出',
    },
    schema: [],
    messages: {
      noDefault: 'TS 文件中不允许使用 export default 导出',
    },
  },
  create(context) {
    const { filename } = context;

    return {
      ExportDefaultDeclaration(node) {
        if (!filename.endsWith('.ts') || isExemptFile(filename)) {
          return;
        }
        context.report({ node, messageId: 'noDefault' });
      },
    };
  },
};
