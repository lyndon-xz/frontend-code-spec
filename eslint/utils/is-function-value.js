// React 里函数值常被 useCallback / useMemo 包一层，只认裸函数表达式会漏掉这批最常见的声明
const FUNCTION_WRAPPER_HOOKS = new Set(['useCallback', 'useMemo']);

function isFunctionExpression(node) {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

// 含 React.useCallback(...) 形态；只认白名单 hook，避免把 const handleId = getHandle() 当函数值
function isWrappedFunctionValue(node) {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const { callee } = node;
  const isMemberHook = callee.type === 'MemberExpression' && callee.property.type === 'Identifier';
  const hookName = isMemberHook ? callee.property.name : callee.name;

  if (!FUNCTION_WRAPPER_HOOKS.has(hookName)) {
    return false;
  }

  const [firstArg] = node.arguments;

  return firstArg !== undefined && isFunctionExpression(firstArg);
}

/** 命名规则借此区分函数成员与普通数据成员，避免误报名词属性 */
export function isFunctionValue(node) {
  if (node == null) {
    return false;
  }

  return isFunctionExpression(node) || isWrappedFunctionValue(node);
}
