import { isFunctionNode } from '../../utils/is-function-node.js';

/**
 * 禁止函数/变量使用 handle 前缀，强制语义化动词。
 * 覆盖：顶层函数声明与函数型变量、类方法、类箭头字段、对象方法/箭头属性。
 * 全程按「函数值」过滤（与 no-internal-on-prefix 的顶层变量行为对齐），
 * 避免误伤名词属性（如 handleId：句柄/账号 handle 之意，并非事件处理器）。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '禁止函数/变量使用 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）',
    },
    schema: [],
    messages: {
      noHandleFn: '函数禁止 handle 前缀，必须使用语义化动词（如 saveData 而非 handleClick）',
      noHandleVar: '变量/函数禁止 handle 前缀，必须使用语义化动词',
    },
  },
  create(context) {
    return {
      // 顶层函数声明：function handleClick() {}
      'FunctionDeclaration > Identifier.id[name=/^handle[A-Z]/]'(node) {
        context.report({ node, messageId: 'noHandleFn' });
      },
      // 函数型变量：const handleSave = () => {}（限定函数值，放行 handleId 等名词变量）
      'VariableDeclarator[init.type=/FunctionExpression|ArrowFunctionExpression/] > Identifier.id[name=/^handle[A-Z]/]'(
        node,
      ) {
        context.report({ node, messageId: 'noHandleVar' });
      },
      // 类方法：class C { handleClick() {} }
      'MethodDefinition > Identifier.key[name=/^handle[A-Z]/]'(node) {
        if (!node.parent.computed) {
          context.report({ node, messageId: 'noHandleFn' });
        }
      },
      // 类箭头字段：handleClick = () => {}
      'PropertyDefinition > Identifier.key[name=/^handle[A-Z]/]'(node) {
        if (!node.parent.computed && isFunctionNode(node.parent.value)) {
          context.report({ node, messageId: 'noHandleFn' });
        }
      },
      // 对象方法 / 箭头属性：{ handleClick() {} } / { handleClick: () => {} }。shorthand 已在变量声明处校验，跳过防重复
      'Property > Identifier.key[name=/^handle[A-Z]/]'(node) {
        const prop = node.parent;
        if (!prop.computed && !prop.shorthand && isFunctionNode(prop.value)) {
          context.report({ node, messageId: 'noHandleFn' });
        }
      },
    };
  },
};
