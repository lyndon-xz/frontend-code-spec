/** 裸 `ref` 同样违规：它没说清指向谁 */
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
    /*
     * :matches() 把 useRef 与 React.useRef 两种 callee 形态并进同一处理器：
     * 两者判定与报错完全一致，分开写只会让同一段逻辑存在两份。
     */
    return {
      // const input = useRef(null) / React.useRef(null)
      'VariableDeclarator:matches([init.callee.name="useRef"], [init.callee.property.name="useRef"]) > Identifier.id[name!=/Ref$/]'(
        node,
      ) {
        context.report({ node, messageId: 'refSuffix' });
      },
      // class C { input = useRef(null) / React.useRef(null) }
      'PropertyDefinition:matches([value.callee.name="useRef"], [value.callee.property.name="useRef"]) > Identifier.key[name!=/Ref$/]'(
        node,
      ) {
        // 计算键（[key] = useRef()）没有可判定的静态名字，跳过
        if (!node.parent.computed) {
          context.report({ node, messageId: 'refSuffix' });
        }
      },
    };
  },
};
