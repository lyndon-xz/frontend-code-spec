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

        // 只处理 JSX 属性中的表达式容器 (如 onClick={...})
        if (!valueExpr || valueExpr.type !== 'JSXExpressionContainer') {
          return;
        }

        const arrow = valueExpr.expression;

        // 只处理箭头函数表达式；async 箭头改写后会丢失 async 语义，跳过
        if (arrow.type !== 'ArrowFunctionExpression' || arrow.async) {
          return;
        }

        // 获取箭头函数的 body (可能是表达式，或仅含单条语句的代码块)
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

        // callee 为 MemberExpression 时存在 this 绑定丢失风险（onClick={(e) => obj.fn(e)} → onClick={obj.fn}），直接跳过
        if (callExpr.callee.type === 'MemberExpression') {
          return;
        }

        // 情况 1: 无参数箭头函数调用无参数函数 — () => fn()。只告警不 fix，避免隐式 event 透传
        if (arrowParams.length === 0 && callArgs.length === 0) {
          const callee = sourceCode.getText(callExpr.callee);
          context.report({ node: arrow, messageId: 'unwrapNoArg', data: { callee } });
          return;
        }

        // 情况 2: 参数逐一透传 — (e) => fn(e) 或 (a, b) => fn(a, b)
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
