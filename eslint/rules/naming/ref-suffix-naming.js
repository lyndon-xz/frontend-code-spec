/** 裸 `ref` 同样违规：它没说清指向谁 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'useRef 声明的变量必须以 Ref 结尾（如 inputRef）',
    },
    schema: [],
    messages: {
      refSuffix:
        'useRef 返回的变量要以 Ref 结尾（如 inputRef）：不带后缀读起来像普通值，读者不知道取值要走 .current',
    },
  },
  create(context) {
    /*
     * :matches() 把 useRef 与 React.useRef 两种 callee 形态并进同一处理器：
     * 两者判定与报错完全一致，分开写只会让同一段逻辑存在两份。
     */
    return {
      'VariableDeclarator:matches([init.callee.name="useRef"], [init.callee.property.name="useRef"]) > Identifier.id[name!=/Ref$/]'(
        node,
      ) {
        context.report({ node, messageId: 'refSuffix' });
      },
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
