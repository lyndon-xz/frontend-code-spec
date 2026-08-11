import { isExemptFile } from '../../utils/is-exempt-file.js';

/** 测试 / mock / 类型声明 / 配置文件豁免；无任何导出的 TSX 视为应用入口，同样豁免。 */
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
        /*
         * 一个导出都没有的 TSX 是应用入口（挂载 root、注册全局配置），没有默认导出可谈。
         * 用「有无导出」而非文件名判定：入口名各仓库不同（main/app/entry），组件文件必然对外导出。
         */
        const exportKinds = new Set([
          'ExportDefaultDeclaration',
          'ExportNamedDeclaration',
          'ExportAllDeclaration',
        ]);
        const exports = node.body.filter((stmt) => exportKinds.has(stmt.type));
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
