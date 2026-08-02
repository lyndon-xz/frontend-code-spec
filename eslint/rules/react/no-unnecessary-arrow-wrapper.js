/**
 * 为防误修的分档策略：
 * - callee 为 MemberExpression（obj.fn）有 this 绑定丢失风险，直接跳过；
 * - async 箭头改写后会丢失 async 语义，直接跳过；
 * - 无参包裹 () => fn() 有 event 隐式透传风险，只告警不自动 fix；
 * - 仅「参数逐一透传」(e) => fn(e) 提供 fix。
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止不必要的箭头函数包裹（如 onClick={() => fn()} 应改为 onClick={fn}）',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unwrapNoArg: '不必要的箭头函数包裹，如需透传参数可直接使用 `{{callee}}`，如需吞发事件则保留',
      unwrapPassthrough: '不必要的箭头函数包裹，参数透传可直接使用 `{{callee}}`',
    },
  },
  create(context) {
    const { sourceCode } = context;

    return {
      JSXAttribute(node) {
        const valueExpr = node.value;

        if (!valueExpr || valueExpr.type !== 'JSXExpressionContainer') {
          return;
        }

        const arrow = valueExpr.expression;

        // async 箭头改写后会丢失 async 语义，跳过
        if (arrow.type !== 'ArrowFunctionExpression' || arrow.async) {
          return;
        }

        let callExpr;
        if (arrow.body.type === 'CallExpression') {
          // () => fn()
          callExpr = arrow.body;
        } else if (arrow.body.type === 'BlockStatement' && arrow.body.body.length === 1) {
          const stmt = arrow.body.body[0];
          if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'CallExpression') {
            // () => { fn(); }
            callExpr = stmt.expression;
          } else if (stmt.type === 'ReturnStatement' && stmt.argument?.type === 'CallExpression') {
            // () => { return fn(); }
            callExpr = stmt.argument;
          } else {
            return;
          }
        } else {
          return;
        }

        const arrowParams = arrow.params;
        const callArgs = callExpr.arguments;

        // this 绑定丢失风险：onClick={(e) => obj.fn(e)} → onClick={obj.fn}
        if (callExpr.callee.type === 'MemberExpression') {
          return;
        }

        // () => fn()：只告警不 fix，去掉包裹会把 event 隐式透传给 fn
        if (arrowParams.length === 0 && callArgs.length === 0) {
          const callee = sourceCode.getText(callExpr.callee);
          context.report({ node: arrow, messageId: 'unwrapNoArg', data: { callee } });
          return;
        }

        // 参数逐一透传：(e) => fn(e) 或 (a, b) => fn(a, b)
        if (
          arrowParams.length > 0 &&
          arrowParams.length === callArgs.length &&
          arrowParams.every((p) => p.type === 'Identifier') &&
          callArgs.every((a, i) => a.type === 'Identifier' && a.name === arrowParams[i].name)
        ) {
          const callee = sourceCode.getText(callExpr.callee);
          context.report({
            node: arrow,
            messageId: 'unwrapPassthrough',
            data: { callee },
            fix(fixer) {
              return fixer.replaceText(arrow, callee);
            },
          });
        }
      },
    };
  },
};
