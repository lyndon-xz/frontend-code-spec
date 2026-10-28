import { SRC_FILE_GLOBS, TS_FILE_GLOBS } from '../constants/source-globs.js';
import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

/*
 * no-restricted-syntax 后出现的配置会整条覆盖先出现的，所以各组选择器集中在这里，
 * 按文件范围拼好再交给 flat config，别处不再单独配置这条规则。
 */

// esquery 看不到注释，只写了注释的 catch 也按空 catch 处理
const CATCH_SELECTORS = [
  {
    selector: 'CatchClause > BlockStatement[body.length=0]',
    message:
      '空 catch 会把错误吞掉，调用方与用户都不知道出了问题：请重新抛出，或给出用户可见的反馈并提供重试或回退',
  },
  {
    selector:
      "CatchClause > BlockStatement[body.length>0]:not(:has(> :not(ExpressionStatement[expression.type='CallExpression'][expression.callee.object.name='console'])))",
    message:
      'catch 里只打日志等于吞掉错误，日志不会让页面恢复：打日志之外还要重新抛出、提示用户或回退到可用状态',
  },
];

const TRY_JSX_SELECTORS = [
  {
    selector: 'TryStatement > BlockStatement > ReturnStatement > :matches(JSXElement, JSXFragment)',
    message:
      'try/catch 拦不住子组件渲染时抛出的错误，渲染发生在 return 之后：请用 Error Boundary 包住可能出错的子树',
  },
];

/*
 * 只认整段就是本机/内网主机名的字符串：开头是可选的协议与 //，结尾是端口、路径或字符串结束。
 * 不加两端锚点时，"localhost 无法访问" 这类提示文案也会被当成地址误报；172.16/12 与 169.254/16 一并覆盖。
 */
const INTERNAL_HOST_PATTERN = String.raw`/^(?:https?:)?(?:\x2F\x2F)?(?:localhost|\[::1\]|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})(?::\d*)?(?:[\x2F?#]|$)/`;
const INTERNAL_HOST_MESSAGE =
  '内网与本机地址写死在源码里，换环境就会请求错地址：请从环境映射或构建期注入的配置读取';

const INTERNAL_HOST_SELECTORS = [
  { selector: `Literal[value=${INTERNAL_HOST_PATTERN}]`, message: INTERNAL_HOST_MESSAGE },
  {
    selector: `TemplateElement[value.raw=${INTERNAL_HOST_PATTERN}]`,
    message: INTERNAL_HOST_MESSAGE,
  },
];

// 这两个文件本身就是环境地址与本机判定的来源
const HOST_SOURCE_FILES = ['src/apis/constants/host.ts', 'src/utils/environment.ts'];

const SECURITY_SELECTORS = [
  {
    selector: "CallExpression[callee.property.name='postMessage'] > Literal[value='*']",
    message:
      'postMessage 的目标源写成 * 时，任何页面都能收到消息：请填接收方确切的 origin，并在接收侧同样校验来源',
  },
];

const I18N_SELECTORS = [
  {
    selector:
      'CallExpression[callee.property.name=/^(toLocaleString|toLocaleDateString|toLocaleTimeString)$/][arguments.length=0]',
    message: 'toLocaleXxx 不传 locale 时结果随运行环境变化：请显式传 locale，或统一走 i18n 工具',
  },
];

const TS_SELECTORS = [...CATCH_SELECTORS, ...TRY_JSX_SELECTORS, ...SECURITY_SELECTORS];

export default [
  {
    // 工具目录里的 .js 只拦空 catch。src 下的 .js 由最后一块覆盖，带上 persist 与内网地址
    files: ['**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', ...CATCH_SELECTORS],
    },
  },
  {
    files: ['**/*.jsx', ...TS_FILE_GLOBS],
    rules: {
      'no-restricted-syntax': ['error', ...TS_SELECTORS],
    },
  },
  {
    files: SRC_FILE_GLOBS,
    ignores: [...EXEMPT_GLOBS, ...HOST_SOURCE_FILES],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...TS_SELECTORS,
        ...I18N_SELECTORS,
        ...INTERNAL_HOST_SELECTORS,
      ],
    },
  },
];
