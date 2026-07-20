// 数据/异步状态字段命名后缀（对应 review-code skill R2.7 / R2.8）。禁止前缀式命名，强制后缀式：
// - `loadingXxx` → 应为 `isLoadingXxx`（布尔用 is 前缀读作判断短语）
// - `errorXxx`   → 应为 `xxxError`（数据类字段用业务动作 + 类型后缀）
// 前缀式让并发多流程状态互相覆盖、读起来别扭（"error flight list"）。
// 仅检查变量声明与对象属性定义的标识符；放行恰好合规的 isLoadingXxx / xxxError。
// 例外：error / loading 后紧跟「通用属性词」（message / code / subtitle 等）时，命名的是错误/加载
// 对象自身的属性（errorMessage、loadingText），而非某领域流程的状态字段（errorFlightList），不受此条约束。

// error / loading 后紧跟这些通用属性词时放行——描述对象自身属性，非领域状态流
const GENERIC_ATTR = new Set([
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

// loading 开头但不是 isLoading/shouldLoading 等布尔前缀形态
const LOADING_PREFIX = /^loading[A-Z]/;
// error 开头且后面直接跟名词（errorMessage 之外的 errorFlightList 等）
const ERROR_PREFIX = /^error[A-Z]/;

function checkName(context, node, name) {
  if (LOADING_PREFIX.test(name)) {
    const suffix = name.slice('loading'.length);
    if (GENERIC_ATTR.has(suffix.toLowerCase())) {
      return;
    }
    context.report({
      node,
      message: `异步加载状态请用布尔前缀式 \`isLoading${suffix}\` 而非 \`${name}\`，并发多流程时前缀式会互相覆盖`,
    });
    return;
  }

  if (ERROR_PREFIX.test(name)) {
    const suffix = name.slice('error'.length);
    if (GENERIC_ATTR.has(suffix.toLowerCase())) {
      return;
    }
    context.report({
      node,
      message: `错误状态字段请用后缀式 \`${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}Error\` 而非前缀式 \`${name}\``,
    });
  }
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: '数据/异步状态字段强制后缀式命名（isLoadingXxx / xxxError），禁止前缀式',
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    return {
      // const loadingFlightList = ... / let errorOrder = ...
      'VariableDeclarator > Identifier.id'(node) {
        checkName(context, node, node.name);
      },
      // 对象/接口属性：{ loadingFlightList: true } / interface State { errorOrder: string }
      'Property > Identifier.key'(node) {
        if (!node.parent.computed) {
          checkName(context, node, node.name);
        }
      },
      'PropertyDefinition > Identifier.key'(node) {
        if (!node.parent.computed) {
          checkName(context, node, node.name);
        }
      },
      'TSPropertySignature > Identifier.key'(node) {
        if (!node.parent.computed) {
          checkName(context, node, node.name);
        }
      },
    };
  },
};
