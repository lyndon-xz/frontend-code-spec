import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

/*
 * 只认「箭头体就是一个调用」的三种形态：表达式体、单语句块体、单 return 块体。
 * 其余形态（多语句、非调用表达式）不是纯包裹，取不到调用时返回 null。
 */
function resolveWrappedCall(arrow) {
  if (arrow.body.type === 'CallExpression') {
    return arrow.body;
  }
  if (arrow.body.type !== 'BlockStatement' || arrow.body.body.length !== 1) {
    return null;
  }

  const stmt = arrow.body.body[0];
  if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'CallExpression') {
    return stmt.expression;
  }
  if (stmt.type === 'ReturnStatement' && stmt.argument?.type === 'CallExpression') {
    return stmt.argument;
  }
  return null;
}

// 参数原样透传的判据：个数相同、逐位同名、两侧都是裸标识符，即 (a, b) => fn(a, b)
function isPassthrough(arrowParams, callArgs) {
  return (
    arrowParams.length > 0 &&
    arrowParams.length === callArgs.length &&
    arrowParams.every((param) => param.type === 'Identifier') &&
    callArgs.every(
      (arg, index) => arg.type === 'Identifier' && arg.name === arrowParams[index].name,
    )
  );
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止不必要的箭头函数包裹（如 onClick={() => fn()} 应改为 onClick={fn}）',
      url: ruleDocsUrl('no-unnecessary-arrow-wrapper'),
    },
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

        const callExpr = resolveWrappedCall(arrow);
        if (callExpr === null) {
          return;
        }

        // 去掉包裹会丢 this 绑定，跳过
        if (callExpr.callee.type === 'MemberExpression') {
          return;
        }

        // () => fn()：只告警不 fix，去掉包裹会把 event 隐式透传给 fn
        if (arrow.params.length === 0 && callExpr.arguments.length === 0) {
          const callee = sourceCode.getText(callExpr.callee);
          context.report({ node: arrow, messageId: 'unwrapNoArg', data: { callee } });
          return;
        }

        if (isPassthrough(arrow.params, callExpr.arguments)) {
          /*
           * 与零参形态同一条风险，故同样只报不修：发射方可能比箭头多传实参
           * （antd Select 按 onChange(value, option) 调用），去掉包裹后多出来的那个会静默落进
           * 被调函数的可选形参，而类型检查看不出来。是否安全交给人判断。
           */
          context.report({
            node: arrow,
            messageId: 'unwrapPassthrough',
            data: { callee: sourceCode.getText(callExpr.callee) },
          });
        }
      },
    };
  },
};
