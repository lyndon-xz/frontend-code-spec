import { ruleDocsUrl } from '../../utils/rule-docs-url.js';

/*
 * 只在状态上下文（useState 声明、State 结尾的类型成员与状态对象字面量）内校验，
 * 这样 errorHandler / loadingSpinner 从构造上就不会被扫到，无需靠通用词白名单穷举放行。
 */

// error / loading 后紧跟这些通用属性词时放行：命名的是对象自身属性（errorMessage），不是领域状态流
const GENERIC_STATE_ATTRIBUTE_WORDS = new Set([
  'message',
  'messages',
  'text',
  'code',
  'title',
  'subtitle',
  'description',
  'reason',
  'detail',
  'details',
  'stack',
  'info',
  'name',
  'type',
  'status',
  'tip',
  'icon',
  'indicator',
  'placeholder',
]);

const LOADING_PREFIX_PATTERN = /^loading[A-Z]/;
const ERROR_PREFIX_PATTERN = /^error[A-Z]/;

const STATE_NAME_SUFFIX_PATTERN = /State$/;

// 含 React.useState(...) 形态
function isUseStateCall(init) {
  if (init?.type !== 'CallExpression') {
    return false;
  }

  const { callee } = init;
  if (callee.type === 'Identifier') {
    return callee.name === 'useState';
  }
  return callee.type === 'MemberExpression' && callee.property.name === 'useState';
}

function isInStateType(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'TSInterfaceDeclaration' || current.type === 'TSTypeAliasDeclaration') {
      return STATE_NAME_SUFFIX_PATTERN.test(current.id.name);
    }
    current = current.parent;
  }
  return false;
}

// 穿过嵌套的对象 / 属性层，看承载它的是 State 结尾的变量还是 useState 的初始值实参
function isInStateObject(property) {
  let current = property.parent;
  while (current.type === 'ObjectExpression' || current.type === 'Property') {
    current = current.parent;
  }

  if (current.type === 'VariableDeclarator') {
    return current.id.type === 'Identifier' && STATE_NAME_SUFFIX_PATTERN.test(current.id.name);
  }
  return isUseStateCall(current);
}

function checkName(context, node) {
  const { name } = node;

  if (LOADING_PREFIX_PATTERN.test(name)) {
    const suffix = name.slice('loading'.length);
    if (GENERIC_STATE_ATTRIBUTE_WORDS.has(suffix.toLowerCase())) {
      return;
    }
    context.report({ node, messageId: 'loadingPrefix', data: { name, suffix } });
    return;
  }

  if (ERROR_PREFIX_PATTERN.test(name)) {
    const suffix = name.slice('error'.length);
    if (GENERIC_STATE_ATTRIBUTE_WORDS.has(suffix.toLowerCase())) {
      return;
    }
    const suggested = `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}Error`;
    context.report({ node, messageId: 'errorPrefix', data: { name, suggested } });
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        '状态上下文（useState / State 类型 / 状态对象）中的数据、异步状态字段强制后缀式命名（isLoadingXxx / xxxError），禁止前缀式',
      url: ruleDocsUrl('status-field-naming'),
    },
    schema: [],
    messages: {
      loadingPrefix:
        '异步加载状态请用布尔前缀式 `isLoading{{suffix}}` 而非 `{{name}}`，并发多流程时前缀式会互相覆盖',
      errorPrefix:
        '错误状态字段请用后缀式 `{{suggested}}` 而非前缀式 `{{name}}`：数据名在前，同一份数据的数据、加载、错误字段才能对上号',
    },
  },
  create(context) {
    return {
      'VariableDeclarator'(node) {
        if (!isUseStateCall(node.init)) {
          return;
        }

        const stateId = node.id.type === 'ArrayPattern' ? node.id.elements[0] : node.id;
        if (stateId?.type === 'Identifier') {
          checkName(context, stateId);
        }
      },
      'TSPropertySignature > Identifier.key'(node) {
        if (!node.parent.computed && isInStateType(node)) {
          checkName(context, node);
        }
      },
      'Property > Identifier.key'(node) {
        if (!node.parent.computed && isInStateObject(node.parent)) {
          checkName(context, node);
        }
      },
    };
  },
};
