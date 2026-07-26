/**
 * 禁止在函数签名中解构，统一在函数体首部解构。
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在函数签名中解构，请在函数体内解构',
    },
    schema: [],
    messages: {
      noParamDestructure: '禁止在函数签名中解构，请在函数体内解构',
    },
  },
  create(context) {
    /**
     * @param {import('estree').Node} node
     * @returns {boolean}
     */
    function isDestructuringPattern(node) {
      return node.type === 'ObjectPattern' || node.type === 'ArrayPattern';
    }

    /**
     * @param {import('estree').Pattern} param
     */
    function checkParam(param) {
      if (isDestructuringPattern(param)) {
        context.report({ node: param, messageId: 'noParamDestructure' });
        return;
      }

      // ({ a } = {}) / ([a] = [])
      if (param.type === 'AssignmentPattern' && isDestructuringPattern(param.left)) {
        context.report({ node: param.left, messageId: 'noParamDestructure' });
        return;
      }

      // ...{ a } / ...[a]
      if (param.type === 'RestElement' && isDestructuringPattern(param.argument)) {
        context.report({ node: param.argument, messageId: 'noParamDestructure' });
      }
    }

    function checkFunction(node) {
      for (const param of node.params) {
        checkParam(param);
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
