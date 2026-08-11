import rule from '../../../rules/naming/status-field-naming.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('status-field-naming', rule, {
  valid: [
    // 合规的布尔前缀式加载状态
    'const [isLoadingList, setIsLoadingList] = useState(false);',
    // 合规的后缀式错误状态
    'const [flightListError, setFlightListError] = useState(null);',
    'interface FlightState { flightListError: string | null }',
    // error/loading 后接通用属性词，描述对象自身属性，放行
    'interface FlightState { errorMessage: string }',
    'interface FlightState { errorCode: number }',
    'interface FlightState { loadingText: string }',
    // 与 loading/error 无关的命名
    'const initialState = { total: 0 };',

    /*
     * 误报守卫：以下标识符都带 error / loading 词根却不在状态上下文内。
     * 这类命名无法靠通用词白名单穷举放行，放行必须来自上下文判定本身，故逐个钉住。
     */
    'const errorHandler = (error) => report(error);',
    'const errorNotifier = defaultNotifier;',
    'const loadingSpinner = renderSpinner();',
    'let errorReporter = noop;',
    'const config = { errorHandler: noop, loadingSpinner: null, errorNotifier: notify };',
    'class ErrorBoundary { errorHandler = (error) => report(error); }',
    'interface Props { errorHandler: () => void; loadingSpinner: unknown }',
    'function report(errorPayload) { return errorPayload; }',
    // 非 State 结尾的类型 / 变量不是状态上下文
    'type Handlers = { errorHandler: () => void };',
    // 内联类型字面量未命名，不构成状态类型
    'let pending: { loadingList: boolean };',
    'const notifiers = { loadingSpinner: null };',
    // 非 useState 的 hook 调用不视为状态上下文
    'const [loadingSpinner, setSpinner] = useSpinner(false);',

    // 计算键不校验（覆盖 computed 守卫分支）
    'const initialState = { [dynamicKey]: 1 };',
    'interface FlightState { [dynamicKey]: number }',
    // useState 解构出非标识符元素（嵌套解构）不校验
    'const [{ list }, setState] = useState({ list: [] });',
  ],
  invalid: [
    {
      // useState 解构出的加载状态
      code: 'const [loadingFlightList, setLoadingFlightList] = useState(false);',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // React.useState 形态
      code: 'const [errorOrder, setErrorOrder] = React.useState(null);',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // 未解构的 useState 变量
      code: 'const loadingFlightList = useState(false);',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // State 类型成员
      code: 'interface FlightState { errorOrder: string }',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // type 别名形式的 State 类型
      code: 'type FlightState = { loadingList: boolean };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // State 类型的嵌套成员
      code: 'interface FlightState { detail: { errorOrder: string } }',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // 状态对象字面量
      code: 'const initialState = { loadingList: false };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // 状态对象的嵌套层同样校验
      code: 'const defaultState = { detail: { errorOrder: null } };',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      // useState 的初始状态对象
      code: 'const [state, setState] = useState({ loadingList: false });',
      errors: [{ messageId: 'loadingPrefix' }],
    },
  ],
});
