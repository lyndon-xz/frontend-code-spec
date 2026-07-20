export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止不必要的箭头函数包裹（如 onClick={() => fn()} 应改为 onClick={fn}）',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const valueExpr = node.value;

        // 只处理 JSX 属性中的表达式容器 (如 onClick={...})
        if (!valueExpr || valueExpr.type !== 'JSXExpressionContainer') {
          return;
        }

        const arrow = valueExpr.expression;

        // 只处理箭头函数表达式
        if (arrow.type !== 'ArrowFunctionExpression') {
          return;
        }

        // 获取箭头函数的 body (可能是代码块或表达式)
        let callExpr;
        if (arrow.body.type === 'CallExpression') {
          // () => fn()
          callExpr = arrow.body;
        } else if (
          arrow.body.type === 'BlockStatement' &&
          arrow.body.body.length === 1 &&
          arrow.body.body[0].type === 'ExpressionStatement' &&
          arrow.body.body[0].expression.type === 'CallExpression'
        ) {
          // () => { fn(); }
          callExpr = arrow.body.body[0].expression;
        } else {
          return;
        }

        const arrowParams = arrow.params;
        const callArgs = callExpr.arguments;

        // 情况 1: 无参数箭头函数调用无参数函数 — () => fn()
        // 需防范误修：MemberExpression 有 this 绑定丢失风险，() => fn() 有 event 隐式透传风险，故只告警不自动 fix。

        if (callExpr.callee.type === 'MemberExpression') {
          // 存在 this 绑定丢失的风险，例如 onClick={(e) => obj.fn(e)} -> onClick={obj.fn} (this 被改变)
          return;
        }

        if (arrowParams.length === 0 && callArgs.length === 0) {
          // 无参数包裹可以报警告但不提供 fix，避免隐式参数透传
          const callee = context.sourceCode.getText(callExpr.callee);

          context.report({
            node: arrow,
            message: `不必要的箭头函数包裹，如需透传参数可直接使用 \`${callee}\`，如需吞发事件则保留`,
          });
          return;
        }

        // 情况 2: 参数透传 — (e) => fn(e) 或 (a, b) => fn(a, b)
        if (
          arrowParams.length > 0 &&
          arrowParams.length === callArgs.length &&
          arrowParams.every((p) => p.type === 'Identifier') &&
          callArgs.every((a, i) => a.type === 'Identifier' && a.name === arrowParams[i].name)
        ) {
          const callee = context.sourceCode.getText(callExpr.callee);

          context.report({
            node: arrow,
            message: `不必要的箭头函数包裹，参数透传可直接使用 \`${callee}\``,
            fix(fixer) {
              return fixer.replaceText(arrow, callee);
            },
          });
        }
      },
    };
  },
};
