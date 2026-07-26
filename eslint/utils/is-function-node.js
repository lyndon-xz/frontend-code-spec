/** 各命名规则共享的「值是否为函数」判定，单一来源避免各处重复导致漂移。 */

/**
 * 判断节点是否为函数值（箭头函数或函数表达式）。
 * 用于命名规则区分「函数成员（方法/箭头属性）」与普通数据成员，避免误报名词属性。
 * @param {object|null|undefined} node
 * @returns {boolean}
 */
export function isFunctionNode(node) {
  return (
    node != null && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')
  );
}
