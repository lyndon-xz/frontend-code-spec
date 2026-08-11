import rule from '../../../rules/naming/status-field-naming.js';
import { createRuleTester } from '../../support/rule-tester.js';

const ruleTester = createRuleTester();

ruleTester.run('status-field-naming', rule, {
  valid: [
    'const [isLoadingList, setIsLoadingList] = useState(false);',
    'const [flightListError, setFlightListError] = useState(null);',
    'interface FlightState { flightListError: string | null }',
    // error/loading 后接通用属性词，描述对象自身属性，放行
    'interface FlightState { errorMessage: string }',
    'interface FlightState { errorCode: number }',
    'interface FlightState { loadingText: string }',
    'const initialState = { total: 0 };',

    // 误报守卫：带 error/loading 词根但不在状态上下文内，放行只能靠上下文判定，故逐个钉住
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

    // 覆盖 computed 守卫分支
    'const initialState = { [dynamicKey]: 1 };',
    'interface FlightState { [dynamicKey]: number }',
    // useState 解构出非标识符元素（嵌套解构）不校验
    'const [{ list }, setState] = useState({ list: [] });',
  ],
  invalid: [
    {
      code: 'const [loadingFlightList, setLoadingFlightList] = useState(false);',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      code: 'const [errorOrder, setErrorOrder] = React.useState(null);',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      code: 'const loadingFlightList = useState(false);',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      code: 'interface FlightState { errorOrder: string }',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      code: 'type FlightState = { loadingList: boolean };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // State 类型的嵌套成员同样校验
      code: 'interface FlightState { detail: { errorOrder: string } }',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      code: 'const initialState = { loadingList: false };',
      errors: [{ messageId: 'loadingPrefix' }],
    },
    {
      // 状态对象的嵌套层同样校验
      code: 'const defaultState = { detail: { errorOrder: null } };',
      errors: [{ messageId: 'errorPrefix' }],
    },
    {
      code: 'const [state, setState] = useState({ loadingList: false });',
      errors: [{ messageId: 'loadingPrefix' }],
    },
  ],
});
