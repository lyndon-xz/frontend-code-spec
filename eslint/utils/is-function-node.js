/** 命名规则借此区分函数成员与普通数据成员，避免误报名词属性 */
export function isFunctionNode(node) {
  return (
    node != null && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
  );
}
