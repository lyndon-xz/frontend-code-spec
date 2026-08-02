import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

import customConfigs from './eslint/index.js';

/**
 * 本仓库同时交付「规则集」与「请求层基础设施范式」：
 * - src/apis 是 code-spec 的一部分（axios 封装范式），也用完整自研规则集校验。
 * - eslint 下的规则源码本身用「与技术栈无关的那批自研规则」+ 基础规则 + Prettier 校验。
 */
export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,

  /** 请求层范式 + 其它 TS/TSX：套用完整领域规则集（parserOptions.project 指向 tsconfig.json）。 */
  ...customConfigs,

  // 规则源码（JS）：语言环境
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },

  /*
   * 规则源码自校验：规则集自己交付的约定，先在自己身上成立。
   * 只启用与技术栈无关的那批——面向 TS/TSX、React、src 分层约定的规则套到 Node 端 ESM 的 .js 上会自相矛盾，
   * 逐条排除理由见下方注释。领域配置里 comment-style 未限定 files，已对本目录生效，故此处不重复配线。
   */
  {
    files: ['eslint/**/*.js'],
    rules: {
      // 规则源码同样禁 Promise 链，统一 async/await
      'custom/no-promise-chain': 'error',
      // 签名不解构，统一在函数体首部解构
      'custom/no-param-destructuring': 'error',
      // 参数禁泛化命名（data/callback）
      'custom/no-generic-param-name': 'error',
      // 函数禁 handle 前缀
      'custom/no-handle-prefix': 'error',
      // 内部函数禁 on 前缀
      'custom/no-internal-on-prefix': 'error',
      // 顶层元素按「类型 → 常量 → 辅助函数 → 主导出」排列
      'custom/file-element-order': 'error',

      /*
       * 未启用的自研规则及理由：
       * - no-ts-default-export：每条规则文件都必须 export default 一个规则对象，与之直接冲突。
       * - require-tsx-default-export / no-unnecessary-arrow-wrapper / props-interface-naming：JSX/TSX 专属，本目录无。
       * - require-enum-initializer：enum 是 TS 语法，JS 里不存在。
       * - ref-suffix-naming：useRef 是 React API，Node 端规则源码不会出现。
       * - status-field-naming：只在 useState / State 类型等状态上下文内校验，本目录无状态上下文。
       * - import-path-boundary / no-component-sidecar-files：依赖 src 分层与 @/ 别名约定，规则源码不在 src 下。
       * - no-barrel：eslint/index.js 的职责就是聚合导出全部规则，barrel 禁令与插件入口的定位冲突。
       * - no-implementation-suffix-filename：规则文件名必须与规则 id 一一对应，命名权归 id 契约，不受业务名词约束。
       * - require-unit-suffix：只校验 TS 类型成员，JS 里没有类型声明可校验。
       * - no-direct-http-client：约束 src 下的业务代码不得绕过请求层，规则源码既不在 src 下也不发请求。
       */
    },
  },

  /*
   * Prettier 格式化基线 — JS/TS/TSX 由 eslint-plugin-prettier 在 lint 中校验；
   * json/yml/md 等其它文本由 `pnpm format:check` 覆盖，避免与 ESLint 重复扫同一批文件。
   */
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
