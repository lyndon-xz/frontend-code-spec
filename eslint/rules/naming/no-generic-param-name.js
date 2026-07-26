/*
 * 禁止函数参数使用泛化命名（data/params/callback/options），强制具体领域词汇。
 * 覆盖普通参数、默认值参数、rest 参数三种形态。
 */
const GENERIC_NAME = /^(data|params|callback|options)$/;

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '禁止函数参数使用泛化命名（data、params、callback、options），请使用具体的领域词汇',
    },
    schema: [],
    messages: {
      noGenericParam: '参数禁止泛化命名（data、params、callback、options），请使用具体的领域词汇',
    },
  },
  create(context) {
    const FN = ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression)';
    return {
      // 普通参数：fn(data)
      [`${FN} > Identifier.params[name=${GENERIC_NAME}]`](node) {
        context.report({ node, messageId: 'noGenericParam' });
      },
      // 默认值参数：fn(data = {})
      [`${FN} > AssignmentPattern.params > Identifier.left[name=${GENERIC_NAME}]`](node) {
        context.report({ node, messageId: 'noGenericParam' });
      },
      // rest 参数：fn(...data)
      [`${FN} > RestElement.params > Identifier.argument[name=${GENERIC_NAME}]`](node) {
        context.report({ node, messageId: 'noGenericParam' });
      },
    };
  },
};
