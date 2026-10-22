import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';
import { SRC_FILE_GLOBS } from '../utils/source-layout.js';

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

const PERSIST_SELECTORS = [
  {
    selector:
      "CallExpression[callee.name='persist'] > ObjectExpression:not(:has(> Property[key.name=/^(partialize|whitelist)$/]))",
    message:
      'persist 默认把整份状态写进存储，连加载态、错误、临时输入一起持久化：请用 partialize（或 whitelist）只列出需要持久化的字段',
  },
];

const TRY_JSX_SELECTORS = [
  {
    selector: 'TryStatement > BlockStatement > ReturnStatement > :matches(JSXElement, JSXFragment)',
    message:
      'try/catch 拦不住子组件渲染时抛出的错误，渲染发生在 return 之后：请用 Error Boundary 包住可能出错的子树',
  },
];

// 正则里的斜杠写成 \x2F：esquery 的正则字面量遇到 / 就结束
const INTERNAL_HOST_PATTERN = String.raw`/localhost|127\.0\.0\.1|192\.168\.|^https?:\x2F\x2F10\./`;
const INTERNAL_HOST_MESSAGE =
  '内网与本机地址写死在源码里，换环境就会请求错地址：请从 src/apis/constants/host.ts 的环境映射或构建期注入的配置读取';

const INTERNAL_HOST_SELECTORS = [
  { selector: `Literal[value=${INTERNAL_HOST_PATTERN}]`, message: INTERNAL_HOST_MESSAGE },
  {
    selector: `TemplateElement[value.raw=${INTERNAL_HOST_PATTERN}]`,
    message: INTERNAL_HOST_MESSAGE,
  },
];

// 这两个文件本身就是环境地址与本机判定的来源
const HOST_SOURCE_FILES = ['src/apis/constants/host.ts', 'src/utils/environment.ts'];

const TS_SELECTORS = [...CATCH_SELECTORS, ...PERSIST_SELECTORS, ...TRY_JSX_SELECTORS];

export default [
  {
    files: ['**/*.js'],
    rules: {
      'no-restricted-syntax': ['error', ...CATCH_SELECTORS],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...TS_SELECTORS],
    },
  },
  {
    files: SRC_FILE_GLOBS,
    ignores: [...EXEMPT_GLOBS, ...HOST_SOURCE_FILES],
    rules: {
      'no-restricted-syntax': ['error', ...TS_SELECTORS, ...INTERNAL_HOST_SELECTORS],
    },
  },
];
