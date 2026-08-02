import { isExemptFile } from './is-exempt-file.js';
import { isFunctionNode } from './is-function-node.js';

/**
 * 生成「禁止以某前缀命名函数」的规则。
 * handle / on 两条命名规则的判定逻辑完全一致，只差前缀、报错文案与是否覆盖对象字面量属性，
 * 故收敛为一个工厂；「值是否为函数」统一走 isFunctionNode。
 *
 * 覆盖形态：函数声明、函数型变量、类方法、类箭头字段，以及（可选）对象字面量的函数属性。
 * @param {object} spec
 * @param {string} spec.prefix 被禁前缀，如 'handle'
 * @param {object} spec.meta 规则 meta，原样透传（docs/messages 是各规则的对外契约）
 * @param {string} spec.functionMessageId 函数声明 / 方法 / 类字段 / 对象属性的报错文案 id
 * @param {string} spec.variableMessageId 函数型变量的报错文案 id
 * @param {boolean} spec.checkObjectProperties 是否校验对象字面量的函数属性
 * @returns {object} ESLint 规则对象
 */
export function createPrefixRule(spec) {
  const { prefix, meta, functionMessageId, variableMessageId, checkObjectProperties } = spec;
  // 锚定在名字开头，且要求前缀后紧跟大写字母（handleClick 命中，handler 不命中）
  const namePattern = new RegExp(`^${prefix}[A-Z]`);

  const isPrefixedIdentifier = (node) => node.type === 'Identifier' && namePattern.test(node.name);

  return {
    meta,
    create(context) {
      /*
       * 测试 / mock 文件豁免：桩函数常按被 mock 的 Props 回调原名声明
       * （const onClick = vi.fn()、mock 出的 handleSubmit），在这里报错等于倒逼改桩名。
       */
      if (isExemptFile(context.filename)) return {};

      function report(node, messageId) {
        context.report({ node, messageId });
      }

      const visitors = {
        FunctionDeclaration(node) {
          if (node.id !== null && isPrefixedIdentifier(node.id)) {
            report(node.id, functionMessageId);
          }
        },
        // 限定函数值，放行 handleId 这类名词变量
        VariableDeclarator(node) {
          if (isPrefixedIdentifier(node.id) && isFunctionNode(node.init)) {
            report(node.id, variableMessageId);
          }
        },
        MethodDefinition(node) {
          if (!node.computed && isPrefixedIdentifier(node.key)) {
            report(node.key, functionMessageId);
          }
        },
        PropertyDefinition(node) {
          if (!node.computed && isPrefixedIdentifier(node.key) && isFunctionNode(node.value)) {
            report(node.key, functionMessageId);
          }
        },
      };

      if (!checkObjectProperties) {
        return visitors;
      }

      return {
        ...visitors,
        // shorthand 属性（{ handleClick }）已在其变量声明处校验，跳过防重复
        Property(node) {
          if (node.computed || node.shorthand) return;
          if (isPrefixedIdentifier(node.key) && isFunctionNode(node.value)) {
            report(node.key, functionMessageId);
          }
        },
      };
    },
  };
}
