# @lyndon/frontend-code-spec

> 前端 **code-spec** 仓库：一套自研 **ESLint 规则防线** + 一套生产可用的**请求层基础设施范式**。把团队的编码约定固化成可执行的 lint 规则，把 axios 封装沉淀成可复制的工程范式。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/) [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/) [![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/) [![pnpm](https://img.shields.io/badge/pnpm-10.12-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/) [![Node](https://img.shields.io/badge/node-%5E20.19%20%7C%7C%20%3E%3D22.12-339933?logo=node.js&logoColor=white)](https://nodejs.org/) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 📖 简介

本仓库交付两类相互印证的产物：

- **ESLint 规则防线** — 位于 `eslint/`，一套按领域聚类的自研规则集，把命名、结构、注释、控制流、解构、React、TypeScript 等约定固化为可执行的 lint 规则。
- **请求层基础设施范式** — 位于 `src/apis/`，一套基于 axios 的请求封装范式 (实例复用、拦截器链、错误归一、自动重试、请求去重、埋点)。它既是可复制的工程范式，本身也被上面这套完整规则集校验，做到 “规则集 dogfood 自己”。

## ✨ 特性

- **规则按领域聚类**：`eslint/rules/<domain>/` 与 `eslint/configs/<domain>` 一一对应，规则 id 扁平 (`custom/<rule-name>`)，领域只体现在目录，不进 id。
- **规则可测**：每条规则在 `eslint/__tests__/` 下有独立用例，基于 ESLint `RuleTester`。
- **请求实例单例化**：同一 `serviceCode` 运行期只创建一个 axios 实例，开发环境对配置漂移告警。
- **拦截器链清晰**：请求阶段 analytics → auth；响应阶段 network → sso → business → analytics，按 FIFO 注册顺序执行。
- **默认吞错、按需抛出**：请求默认成功返回数据、失败返回 `null`，可通过 `isErrorSwallowed: false` 改为抛出 `RequestError`。
- **响应自动拆包**：剥离业务信封只返回 `data`。
- **可选自动重试与请求去重**：`retry` 控制可重试错误的退避重试，`isDeduped` 在快速改条件时取消上一次请求，并支持传入 `AbortSignal` 主动取消。
- **一体化质量校验**：`verify:ci` 串联类型检查、ESLint、Prettier、Stylelint、文件名 lint、中文文案 lint 与覆盖率测试。

## 🧱 技术栈

- **语言 / 运行时**：TypeScript 5.9、Node (`^20.19.0 || >=22.12.0`)、pnpm 10.12
- **规则引擎**：ESLint 9 (flat config)、`@typescript-eslint`、`eslint-plugin-import` / `react` / `react-hooks`
- **请求层**：axios、antd (UI 侧配套)、React 19
- **测试**：Vitest 4 + `@vitest/coverage-v8` + jsdom
- **工程化**：Prettier、Stylelint、`@ls-lint/ls-lint`、zhlint、husky + lint-staged、commitlint

## 📂 目录结构

```text
.
├── eslint/                     # ESLint 规则防线
│   ├── index.js                # 规则总入口：注册插件、组装领域配置
│   ├── configs/                # 领域配置（与 rules/<domain>/ 一一对应）
│   ├── rules/                  # 自研规则源码，按领域聚类
│   │   ├── comments/           # 注释风格
│   │   ├── control-flow/       # 控制流 / 异步
│   │   ├── destructuring/      # 解构写法
│   │   ├── naming/             # 命名约定
│   │   ├── react/              # React 组件约定
│   │   ├── structure/          # 模块 / 文件 / 导出组织
│   │   └── typescript/         # 类型系统
│   ├── utils/                  # 规则共用工具
│   └── __tests__/              # 规则用例
├── eslint.config.js            # 仓库顶层 flat config（含 Prettier 基线）
├── src/
│   ├── apis/                   # 请求层基础设施范式
│   │   ├── request.ts          # 请求工厂：实例复用 + 重试 + 去重 + 拆包
│   │   ├── interceptors/       # 拦截器：analytics / auth / sso / error
│   │   ├── services/           # 业务接口示例（如 flight）
│   │   ├── constants/          # 业务码、host 等常量
│   │   ├── types/              # 请求配置、响应、拦截器类型
│   │   └── utils/              # base-url / dedupe / retry / error 等
│   ├── components/             # 组件示例
│   ├── constants/
│   └── utils/
├── tsconfig.json
└── vitest.config.ts
```

## 📦 安装

```bash
pnpm install
```

要求 Node `^20.19.0 || >=22.12.0`、pnpm `>=10.12.4` (见 `package.json` 的 `engines`)。

## 🛠️ 使用

### 应用 ESLint 规则集

仓库顶层 `eslint.config.js` 已引入 `eslint/index.js` 里的全部自研规则。在你的项目中复用时，导入该配置并追加到 flat config 数组：

```js
// eslint.config.js
import customConfigs from './eslint/index.js';

export default [
  // ...你的基础配置
  ...customConfigs,
];
```

规则统一注册在 `custom` 命名空间下，规则 id 形如 `custom/no-barrel`、`custom/props-interface-naming`。

### 使用请求层范式

用请求工厂按 `serviceCode` 生成对应 HTTP 方法的请求函数，在 `services/` 中封装业务接口：

```ts
import { createGetRequest, createPostRequest } from '@/apis/request';

const FLIGHT_SERVICE_CODE = '33251';
const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

// 查询：开启去重（快速改筛选时取消上一次请求）+ 对瞬时故障重试
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/api/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

// 变更：不重试、不去重，避免重复下单
export const bookFlight = (payload: BookFlightPayload) =>
  post<BookFlightResult>({ url: '/api/flight/book', data: payload });
```

默认失败返回 `null` 并弹出错误提示；需要自行处理错误时传 `isErrorSwallowed: false`，捕获抛出的 `RequestError`。错误提示可通过 `businessError` / `networkError` 的 `isSilent`、`customMessage` 定制。

## ⌨️ 脚本

| 命令                  | 说明                                                           |
| --------------------- | -------------------------------------------------------------- |
| `pnpm lint`           | 运行 ESLint                                                    |
| `pnpm lint:fix`       | ESLint 自动修复                                                |
| `pnpm lint:filename`  | 用 ls-lint 校验文件名规范                                      |
| `pnpm lint:style`     | 用 Stylelint 校验 SCSS                                         |
| `pnpm lint:md`        | 用 zhlint 校验 Markdown 中文文案                               |
| `pnpm format`         | Prettier 格式化                                                |
| `pnpm format:check`   | Prettier 检查（不写入）                                        |
| `pnpm type-check`     | `tsc --noEmit` 类型检查                                        |
| `pnpm test`           | 运行 Vitest                                                    |
| `pnpm test:cov`       | 运行测试并生成覆盖率                                           |
| `pnpm verify` / `:ci` | 一体化校验：类型 + lint + 格式 + 样式 + 文件名 + 文案 + 覆盖率 |

## 🧪 测试

基于 Vitest (jsdom 环境)。规则用例在 `eslint/__tests__/`，请求层用例在 `src/apis/__tests__/`。

```bash
pnpm test        # 交互 / watch
pnpm test:cov    # 单次运行并输出覆盖率
```

## 📄 License

[MIT](./LICENSE) © Lyndon
