/**
 * 兼容 useRef(...) 与 xxx.useRef(...) 两种调用形态，覆盖变量声明与类字段。
 * 裸 `ref` 同样违规：它没有指向对象，属泛化命名，要求写成 inputRef / containerRef 这类「指向 + Ref」形态。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'useRef 声明的变量必须以 Ref 结尾（如 inputRef）',
    },
    schema: [],
    messages: {
      refSuffix: 'Ref 变量必须以 Ref 结尾（如 inputRef）',
    },
  },
  create(context) {
    return {
      // const input = useRef(null)
      'VariableDeclarator[init.callee.name="useRef"] > Identifier.id[name!=/Ref$/]'(node) {
        context.report({ node, messageId: 'refSuffix' });
      },
      // const input = React.useRef(null)
      'VariableDeclarator[init.callee.property.name="useRef"] > Identifier.id[name!=/Ref$/]'(node) {
        context.report({ node, messageId: 'refSuffix' });
      },
      // class C { input = useRef(null) }
      'PropertyDefinition[value.callee.name="useRef"] > Identifier.key[name!=/Ref$/]'(node) {
        if (!node.parent.computed) {
          context.report({ node, messageId: 'refSuffix' });
        }
      },
      // class C { input = React.useRef(null) }
      'PropertyDefinition[value.callee.property.name="useRef"] > Identifier.key[name!=/Ref$/]'(
        node,
      ) {
        if (!node.parent.computed) {
          context.report({ node, messageId: 'refSuffix' });
        }
      },
    };
  },
};
