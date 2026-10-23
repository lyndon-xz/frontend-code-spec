import { isExemptFile } from './is-exempt-file.js';

// React 里函数值常被 useCallback / useMemo 包一层，只认裸函数表达式会漏掉这批最常见的声明
const FUNCTION_WRAPPER_HOOKS = new Set(['useCallback', 'useMemo']);

function isFunctionExpression(node) {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

// 含 React.useCallback(...) 形态；只认白名单 hook，避免把 const handleId = getHandle() 当函数值
function isWrappedFunctionValue(node) {
  if (node.type !== 'CallExpression') {
    return false;
  }

  const { callee } = node;
  const isMemberHook = callee.type === 'MemberExpression' && callee.property.type === 'Identifier';
  const hookName = isMemberHook ? callee.property.name : callee.name;

  if (!FUNCTION_WRAPPER_HOOKS.has(hookName)) {
    return false;
  }

  const [firstArg] = node.arguments;

  return firstArg !== undefined && isFunctionExpression(firstArg);
}

/** 命名规则借此区分函数成员与普通数据成员，避免误报名词属性 */
export function isFunctionValue(node) {
  if (node == null) {
    return false;
  }

  return isFunctionExpression(node) || isWrappedFunctionValue(node);
}

/** handle / on 两条规则判定逻辑一致，只差前缀与是否覆盖对象属性，故收敛为工厂 */
export function createPrefixRule(spec) {
  // 解构顺序与两个调用处传参的字面量顺序一致，便于对照读
  const { prefix, checkObjectProperties, functionMessageId, variableMessageId, meta } = spec;
  const namePattern = new RegExp(`^${prefix}[A-Z]`);

  const isPrefixedIdentifier = (node) => node.type === 'Identifier' && namePattern.test(node.name);

  return {
    meta,
    create(context) {
      // 桩函数常按被 mock 的 Props 回调原名声明，在这里报错等于倒逼改桩名
      if (isExemptFile(context.filename)) {
        return {};
      }

      function report(node, messageId) {
        context.report({ node, messageId });
      }

      const visitors = {
        FunctionDeclaration(node) {
          if (node.id !== null && isPrefixedIdentifier(node.id)) {
            report(node.id, functionMessageId);
          }
        },
        VariableDeclarator(node) {
          if (isPrefixedIdentifier(node.id) && isFunctionValue(node.init)) {
            report(node.id, variableMessageId);
          }
        },
        MethodDefinition(node) {
          if (!node.computed && isPrefixedIdentifier(node.key)) {
            report(node.key, functionMessageId);
          }
        },
        PropertyDefinition(node) {
          if (!node.computed && isPrefixedIdentifier(node.key) && isFunctionValue(node.value)) {
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
          if (node.computed || node.shorthand) {
            return;
          }
          if (isPrefixedIdentifier(node.key) && isFunctionValue(node.value)) {
            report(node.key, functionMessageId);
          }
        },
      };
    },
  };
}
