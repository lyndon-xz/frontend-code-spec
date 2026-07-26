import { isExemptFile } from '../../utils/is-exempt-file.js';

/**
 * TS 文件（非 TSX）禁止使用 export default，强制具名导出。
 * .d.ts / .config.ts / 测试 / mock 文件豁免。
 */
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
        if (!filename || !filename.endsWith('.ts') || isExemptFile(filename)) {
          return;
        }
        context.report({ node, messageId: 'noDefault' });
      },
    };
  },
};
