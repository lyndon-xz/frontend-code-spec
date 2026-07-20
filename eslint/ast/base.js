/**
 * base — 基础控制流/表达式的节点级硬约束（原子 AST 校验，不依赖类型信息）。
 */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止 .then()/.catch() 链式调用与函数签名解构，统一 async/await 并在函数体内解构',
    },
    schema: [],
    messages: {
      noThenChain: '禁止使用 .then() 链式调用，请统一使用 async/await',
      noCatchChain: '禁止使用 .catch() 链式调用，请统一使用 async/await',
      noParamDestructure: '禁止在函数签名中解构，请在函数体内解构',
    },
  },
  create(context) {
    return {
      'CallExpression[callee.property.name="then"]'(node) {
        context.report({ node, messageId: 'noThenChain' });
      },
      'CallExpression[callee.property.name="catch"]'(node) {
        context.report({ node, messageId: 'noCatchChain' });
      },
      ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression) > ObjectPattern'(node) {
        context.report({ node, messageId: 'noParamDestructure' });
      },
    };
  },
};
