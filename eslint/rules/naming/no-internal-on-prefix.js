import { isFunctionNode } from '../../utils/is-function-node.js';

/**
 * on 前缀仅用于 Props 回调声明，内部函数禁止 on 前缀，强制语义化动词。
 * 覆盖内部函数定义的四种形态：函数声明、函数型变量、类方法、类箭头字段。
 * 刻意不覆盖对象属性与接口/类型成员：on 前缀在 Props 回调声明处合法，而这些位置常正是回调 Props 的声明处
 * （如 { onClick } 配置对象、interface Props { onClick: () => void }），覆盖会误报合法用法。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
    },
    schema: [],
    messages: {
      noInternalOn:
        '`on` 前缀仅用于 Props 回调声明，内部函数请使用语义化动词（如 saveData 而非 onSave）',
    },
  },
  create(context) {
    return {
      // 函数型变量：const onSave = () => {}
      'VariableDeclarator[init.type=/FunctionExpression|ArrowFunctionExpression/] > Identifier.id[name=/^on[A-Z]/]'(
        node,
      ) {
        context.report({ node, messageId: 'noInternalOn' });
      },
      // 函数声明：function onReset() {}
      'FunctionDeclaration > Identifier.id[name=/^on[A-Z]/]'(node) {
        context.report({ node, messageId: 'noInternalOn' });
      },
      // 类方法：class C { onTap() {} }（类成员必为内部实现，非 Props 声明）
      'MethodDefinition > Identifier.key[name=/^on[A-Z]/]'(node) {
        if (!node.parent.computed) {
          context.report({ node, messageId: 'noInternalOn' });
        }
      },
      // 类箭头字段：onTap = () => {}
      'PropertyDefinition > Identifier.key[name=/^on[A-Z]/]'(node) {
        if (!node.parent.computed && isFunctionNode(node.parent.value)) {
          context.report({ node, messageId: 'noInternalOn' });
        }
      },
    };
  },
};
