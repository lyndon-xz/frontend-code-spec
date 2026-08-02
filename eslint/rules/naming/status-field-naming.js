/*
 * 数据/异步状态字段命名后缀。禁止前缀式命名，强制后缀式：
 * - `loadingXxx` → 应为 `isLoadingXxx`（布尔用 is 前缀读作判断短语）
 * - `errorXxx`   → 应为 `xxxError`（数据类字段用业务动作 + 类型后缀）
 * 前缀式让并发多流程状态互相覆盖、读起来别扭（"error flight list"）。
 *
 * 只在「状态上下文」内校验，而非所有变量与属性：
 * - useState 声明（含解构出的 state 变量与直接传入的初始状态对象）；
 * - 名字以 State 结尾的类型成员（interface FlightState { ... }）；
 * - 名字以 State 结尾的状态对象字面量（const initialState = { ... }，含其嵌套层）。
 * 这样 errorHandler / errorNotifier / loadingSpinner 这类「不是状态字段」的标识符从构造上就不会被扫到，
 * 无需靠通用词白名单去穷举放行（穷举必漏，漏了就是规则倒逼命名）。
 *
 * 状态上下文内仍保留一个例外：error / loading 后紧跟「通用属性词」（message / code / text 等）时，
 * 命名的是错误/加载对象自身的属性（errorMessage、loadingText），而非某领域流程的状态字段（errorFlightList）。
 */

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

// 状态类型 / 状态对象的命名约定：以 State 结尾（State、FlightState、initialState）
const STATE_NAME = /State$/;

// init 是否为 useState(...) 调用（含 React.useState(...)）
function isUseStateCall(init) {
  if (init?.type !== 'CallExpression') return false;

  const { callee } = init;
  if (callee.type === 'Identifier') return callee.name === 'useState';
  return callee.type === 'MemberExpression' && callee.property.name === 'useState';
}

// 属性签名是否位于状态类型内：向上找最近的 interface / type 声明，看其名字是否以 State 结尾
function isInStateType(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'TSInterfaceDeclaration' || current.type === 'TSTypeAliasDeclaration') {
      return STATE_NAME.test(current.id.name);
    }
    current = current.parent;
  }
  return false;
}

/*
 * 属性是否位于状态对象字面量内：穿过嵌套的对象/属性层，看承载它的是
 * 以 State 结尾的变量（const initialState = {...}）还是 useState 的初始值实参。
 */
function isInStateObject(property) {
  let current = property.parent;
  while (current.type === 'ObjectExpression' || current.type === 'Property') {
    current = current.parent;
  }

  if (current.type === 'VariableDeclarator') {
    return current.id.type === 'Identifier' && STATE_NAME.test(current.id.name);
  }
  return isUseStateCall(current);
}

function checkName(context, node) {
  const { name } = node;

  if (LOADING_PREFIX.test(name)) {
    const suffix = name.slice('loading'.length);
    if (GENERIC_ATTR.has(suffix.toLowerCase())) {
      return;
    }
    context.report({ node, messageId: 'loadingPrefix', data: { name, suffix } });
    return;
  }

  if (ERROR_PREFIX.test(name)) {
    const suffix = name.slice('error'.length);
    if (GENERIC_ATTR.has(suffix.toLowerCase())) {
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
    },
    fixable: null,
    schema: [],
    messages: {
      loadingPrefix:
        '异步加载状态请用布尔前缀式 `isLoading{{suffix}}` 而非 `{{name}}`，并发多流程时前缀式会互相覆盖',
      errorPrefix: '错误状态字段请用后缀式 `{{suggested}}` 而非前缀式 `{{name}}`',
    },
  },
  create(context) {
    return {
      // useState 声明：const [loadingList, setLoadingList] = useState(false) / const loadingList = useState(false)
      VariableDeclarator(node) {
        if (!isUseStateCall(node.init)) return;

        const stateId = node.id.type === 'ArrayPattern' ? node.id.elements[0] : node.id;
        if (stateId?.type === 'Identifier') {
          checkName(context, stateId);
        }
      },
      // 状态类型成员：interface FlightState { errorOrder: string }
      'TSPropertySignature > Identifier.key'(node) {
        if (!node.parent.computed && isInStateType(node)) {
          checkName(context, node);
        }
      },
      // 状态对象字面量：const initialState = { loadingList: false }
      'Property > Identifier.key'(node) {
        if (!node.parent.computed && isInStateObject(node.parent)) {
          checkName(context, node);
        }
      },
    };
  },
};
