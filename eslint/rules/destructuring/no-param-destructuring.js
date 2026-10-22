import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止在函数签名中解构，请在函数体内解构',
      url: ruleDocsUrl('no-param-destructuring'),
    },
    schema: [],
    messages: {
      noParamDestructure:
        '签名里解构会丢掉参数的整体名，加字段要改签名，解构行也没处写注释：签名只保留完整形参名（如 props），在函数体首部解构',
    },
  },
  create(context) {
    function isDestructuringPattern(node) {
      return node.type === 'ObjectPattern' || node.type === 'ArrayPattern';
    }

    function checkParam(param) {
      if (isDestructuringPattern(param)) {
        context.report({ node: param, messageId: 'noParamDestructure' });
        return;
      }

      if (param.type === 'AssignmentPattern' && isDestructuringPattern(param.left)) {
        context.report({ node: param.left, messageId: 'noParamDestructure' });
        return;
      }

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
