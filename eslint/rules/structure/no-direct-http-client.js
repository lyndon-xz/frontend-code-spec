import { normalizePath } from '../../utils/normalize-path.js';

/*
 * 业务代码禁止直连 HTTP 客户端：axios / fetch / XMLHttpRequest 只能出现在请求层内部。
 * 统一的错误归一、错误提示、重试、去重与埋点全都挂在请求层的拦截器链上，
 * 绕过它的调用一项都拿不到，出故障时也没有任何埋点痕迹可查。
 */

// 选项默认值的唯一来源：schema 的 default 与 create 里的取值都引用此处
const DEFAULT_OPTIONS = {
  clientModules: ['axios', 'node-fetch', 'got', 'superagent', 'ky'],
  globalClients: ['fetch', 'XMLHttpRequest'],
  allowedPaths: ['src/apis'],
};

// 承载 fetch / XMLHttpRequest 的宿主对象，用于识别 window.fetch 这类挂全局的写法
const GLOBAL_OBJECTS = new Set(['window', 'globalThis', 'self']);

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        '请求层之外禁止直连 HTTP 客户端（import axios、调用 fetch / new XMLHttpRequest），必须走 apis 层统一出口',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          clientModules: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_OPTIONS.clientModules,
          },
          globalClients: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_OPTIONS.globalClients,
          },
          allowedPaths: {
            type: 'array',
            items: { type: 'string' },
            default: DEFAULT_OPTIONS.allowedPaths,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noClientImport:
        '请求层之外禁止直接引入 `{{module}}`：请调用 apis 层导出的请求函数，否则会绕过错误归一、提示、重试与埋点',
      noGlobalClient:
        '请求层之外禁止直接使用 `{{client}}`：请调用 apis 层导出的请求函数，否则会绕过错误归一、提示、重试与埋点',
    },
  },
  create(context) {
    const { clientModules, globalClients, allowedPaths } = {
      ...DEFAULT_OPTIONS,
      ...context.options[0],
    };

    // 请求层自身必须直连，否则无从封装
    const filePath = normalizePath(context.filename);
    if (allowedPaths.some((allowedPath) => filePath.includes(allowedPath))) return {};

    const modules = new Set(clientModules);
    const clients = new Set(globalClients);

    const reportGlobalClient = (node, clientName) => {
      context.report({ node, messageId: 'noGlobalClient', data: { client: clientName } });
    };

    return {
      ImportDeclaration(node) {
        const moduleName = node.source.value;
        if (modules.has(moduleName)) {
          context.report({ node, messageId: 'noClientImport', data: { module: moduleName } });
        }
      },
      // fetch('/api/x')
      'CallExpression > Identifier.callee'(node) {
        if (clients.has(node.name)) {
          reportGlobalClient(node, node.name);
        }
      },
      // new XMLHttpRequest()
      'NewExpression > Identifier.callee'(node) {
        if (clients.has(node.name)) {
          reportGlobalClient(node, node.name);
        }
      },
      /*
       * 挂在全局对象上的写法：window.fetch / globalThis.fetch / self.fetch。
       * 只认这三个宿主对象，不拦任意 obj.fetch —— 自研封装的方法名也可能叫 fetch，
       * 那属于本仓库无从判断的领域命名，误报的代价高于漏报。
       */
      'MemberExpression > Identifier.property'(node) {
        const { parent } = node;
        if (parent.computed) return;
        if (parent.object.type !== 'Identifier') return;
        if (!GLOBAL_OBJECTS.has(parent.object.name)) return;
        if (clients.has(node.name)) {
          reportGlobalClient(node, node.name);
        }
      },
    };
  },
};
