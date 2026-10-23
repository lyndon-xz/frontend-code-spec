import { isExemptFile } from '../../utils/is-exempt-file.js';

// params / options 在请求与配置场景常见，不纳入默认黑名单
const DEFAULT_BANNED_NAMES = ['data', 'callback'];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 整名匹配：只禁泛化整名，userData / dataSource 这类带领域词的复合名放行
const buildNamePattern = (bannedNames) =>
  new RegExp(`^(${bannedNames.map(escapeRegExp).join('|')})$`);

const FUNCTION_NODE_SELECTOR =
  ':matches(FunctionDeclaration, ArrowFunctionExpression, FunctionExpression)';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '禁止函数参数使用泛化命名，请使用具体的领域词汇',
    },
    schema: [
      {
        type: 'object',
        properties: {
          bannedNames: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            minItems: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noGenericParam:
        '参数名（{{names}}）不说明传的是什么，读者得跳进实现或类型才能确认：请改用具体的领域词汇（如 hotel、onSelect）',
    },
  },

  create(context) {
    // 桩函数与 vi.mock 工厂里的 (data) 是合理的，不该倒逼改桩
    if (isExemptFile(context.filename)) {
      return {};
    }

    const bannedNames = context.options[0]?.bannedNames ?? DEFAULT_BANNED_NAMES;
    const namePattern = buildNamePattern(bannedNames);
    const namesText = bannedNames.join('、');

    const reportIfBanned = (node) => {
      if (!namePattern.test(node.name)) {
        return;
      }
      context.report({ node, messageId: 'noGenericParam', data: { names: namesText } });
    };

    return {
      // 普通参数：fn(data)
      [`${FUNCTION_NODE_SELECTOR} > Identifier.params`](node) {
        reportIfBanned(node);
      },
      // 默认值参数：fn(data = {})
      [`${FUNCTION_NODE_SELECTOR} > AssignmentPattern.params > Identifier.left`](node) {
        reportIfBanned(node);
      },
      // rest 参数：fn(...data)
      [`${FUNCTION_NODE_SELECTOR} > RestElement.params > Identifier.argument`](node) {
        reportIfBanned(node);
      },
    };
  },
};
