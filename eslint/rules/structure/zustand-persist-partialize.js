/** persist 默认持久化整份状态：加载态、错误与临时输入都会进存储 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'zustand persist 必须用 partialize 或 whitelist 只列需要持久化的字段',
    },
    schema: [],
    messages: {
      partialize:
        'persist 默认把整份状态写进存储，连加载态、错误、临时输入一起持久化：请用 partialize（或 whitelist）只列出需要持久化的字段',
    },
  },
  create(context) {
    const persistNames = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'zustand/middleware' && node.source.value !== 'zustand/persist') {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'persist') {
            persistNames.add(specifier.local.name);
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || !persistNames.has(node.callee.name)) {
          return;
        }

        const options = node.arguments[1];

        if (options == null) {
          context.report({ node, messageId: 'partialize' });
          return;
        }

        // 选项来自变量时静态判不出，交给人工
        if (options.type !== 'ObjectExpression') {
          return;
        }

        const keepsNarrowState = options.properties.some(
          (property) =>
            property.type === 'Property' &&
            !property.computed &&
            ((property.key.type === 'Identifier' &&
              /^(?:partialize|whitelist)$/.test(property.key.name)) ||
              (property.key.type === 'Literal' &&
                /^(?:partialize|whitelist)$/.test(property.key.value))),
        );

        if (!keepsNarrowState) {
          context.report({ node, messageId: 'partialize' });
        }
      },
    };
  },
};
