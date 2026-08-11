/** 裸 `ref` 同样违规：它没说清指向谁，要求写成 inputRef / containerRef 这类「指向 + Ref」形态 */
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
        // 计算键（[key] = useRef()）没有可判定的静态名字，跳过
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
