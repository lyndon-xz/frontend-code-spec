# @lyndon/frontend-code-spec

> 一个面向前端工程的 **code-spec 仓库**：一半是 **ESLint 自定义规则防线**，一半是 **axios 请求层范式样板**。  
> 仓库既给出“该怎么约束代码”，也给出“基础设施该怎么落地”。

![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-9.33.0-4B32C3?logo=eslint&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-4.1.2-6E9F18?logo=vitest&logoColor=white) ![Node](https://img.shields.io/badge/Node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-339933?logo=node.js&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-10.12.4-F69220?logo=pnpm&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-black)

## 📖 简介

这个仓库聚焦两件事：

- `eslint/` 提供一组按领域拆分的自定义规则与 flat config
- `src/apis/` 提供一套请求层封装范式，覆盖鉴权、SSO、业务码、错误提示、重试、去重、埋点等常见能力

它更像一个“可执行规范仓”，而不是单纯的工具箱。规则、示例代码、测试和 CI 是绑在一起演进的。

## ✨ 特性

- **规则集不是单点规则堆砌**：按 `comments / control-flow / destructuring / naming / react / structure / typescript` 分域组织
- **规则与范式同仓维护**：不仅限制怎么写代码，也给出请求层基础设施该怎么写
- **请求层默认带护栏**：错误归一、静默/自定义提示、可选重试、请求去重、SSO 跳转、埋点串联
- **可注入扩展点**：错误提示、埋点上报、token 读取都可替换为业务实现
- **质量门禁完整**：`type-check + lint + format + filename + markdown + coverage`
- **测试覆盖高**：规则集与请求层样板同仓用 Vitest 校验

## 🧱 技术栈

- **语言**：TypeScript、JavaScript（ESM）
- **Lint**：ESLint 9 flat config、`@typescript-eslint`、`eslint-plugin-react`、`eslint-plugin-import`
- **格式化**：Prettier
- **测试**：Vitest + V8 Coverage + jsdom
- **请求层**：axios
- **工程化**：pnpm、husky、lint-staged、GitHub Actions

## 📂 目录结构

```text
.
├── eslint/
│   ├── configs/          # 领域配置
│   ├── rules/            # 自定义规则实现
│   ├── utils/            # 规则公共工具
│   └── __tests__/        # RuleTester 用例
├── src/
│   ├── apis/             # 请求层范式与示例 service
│   │   ├── interceptors/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── __tests__/
│   ├── components/       # 少量 React dogfood 示例
│   └── utils/
├── .github/workflows/    # GitHub CI
└── eslint.config.js      # 仓库顶层 flat config 入口
```

## 📦 安装

```bash
pnpm install
```

要求：

- Node：`^20.19.0 || >=22.12.0`
- pnpm：`>=10.12.4`

## 🚀 快速开始

### 1. 跑完整校验

```bash
pnpm run verify
```

### 2. 单独运行测试

```bash
pnpm run test
pnpm run test:cov
```

### 3. 单独运行 ESLint

```bash
pnpm run lint
pnpm run lint:fix
```

## 🛠️ 使用

### 使用规则集

仓库顶层 `eslint.config.js` 会把 `eslint/index.js` 里的自定义规则注册到 `custom/*` 命名空间下。

典型规则包括：

- `custom/no-promise-chain`
- `custom/no-generic-param-name`
- `custom/no-handle-prefix`
- `custom/no-internal-on-prefix`
- `custom/file-element-order`
- `custom/no-barrel`
- `custom/no-ts-default-export`
- `custom/require-tsx-default-export`

其中 `no-generic-param-name` 当前默认禁用的是 `data` / `callback`，`params` / `options` 默认放行；如需收窄或扩展，可通过 `bannedNames` 配置：

```js
{
  rules: {
    'custom/no-generic-param-name': ['error', { bannedNames: ['data', 'callback', 'params'] }],
  },
}
```

### 使用请求层范式

在 `src/apis/services/` 里按 `serviceCode` 创建请求函数，再封装业务接口：

```ts
import { createGetRequest, createPostRequest } from '@/apis/request';

const FLIGHT_SERVICE_CODE = '33251';
const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/api/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

export const bookFlight = (payload: BookFlightPayload) =>
  post<BookFlightResult>({ url: '/api/flight/book', data: payload });
```

默认行为：

- 成功时返回拆包后的 `data`
- 失败时默认返回 `null`
- 传 `isErrorSwallowed: false` 时改为抛出 `RequestError`
- 可通过 `businessError` / `networkError` 配置静默或自定义提示
- `retry` 仅对可恢复错误生效
- `isDeduped` 会取消上一个同签名在飞请求

## ⚙️ 配置

### 请求层扩展点

当前请求层提供三个显式可注入点：

- `setErrorNotifier()` / `resetErrorNotifier()`：替换默认错误提示实现
- `setAnalyticsSender()` / `resetAnalyticsSender()`：替换生产环境埋点上报实现
- `setAuthTokenProvider()` / `resetAuthTokenProvider()`：替换默认 token 读取实现

### 实例级配置

`createRequest()` / `createGetRequest()` / `createPostRequest()` 等支持第三个参数传实例级选项：

```ts
const get = createGetRequest('33251', {
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
```

同一 `serviceCode` 在运行期只创建一个 axios 实例；若后续再次用不同实例级配置创建，开发环境会给出配置漂移告警。

## 💡 示例

### 静默错误提示

```ts
get<FlightDetail>({
  url: '/api/flight/detail',
  params: { flightNo },
  businessError: { isSilent: true },
  networkError: { isSilent: true },
});
```

### 自定义业务错误文案

```ts
get<FlightDetail>({
  url: '/api/flight/detail',
  params: { flightNo },
  businessError: { customMessage: '获取航班信息失败，请稍后重试' },
});
```

### 调用方自行处理错误

```ts
post<BookFlightResult>({
  url: '/api/flight/book',
  data: payload,
  isErrorSwallowed: false,
  businessError: { isSilent: true },
  networkError: { isSilent: true },
});
```

## ⌨️ 脚本

| 命令                     | 说明                                  |
| ------------------------ | ------------------------------------- |
| `pnpm run lint`          | 运行 ESLint                           |
| `pnpm run lint:fix`      | 自动修复 ESLint 可修项                |
| `pnpm run lint:filename` | 运行 ls-lint 检查命名                 |
| `pnpm run lint:md`       | 运行 zhlint 检查 Markdown             |
| `pnpm run lint:style`    | 运行 Stylelint 检查 SCSS              |
| `pnpm run format`        | 用 Prettier 格式化仓库                |
| `pnpm run format:check`  | 检查 json/yml/md/scss/css/html 的格式 |
| `pnpm run type-check`    | 运行 TypeScript 类型检查              |
| `pnpm run test`          | 运行 Vitest                           |
| `pnpm run test:cov`      | 运行测试并输出覆盖率                  |
| `pnpm run verify`        | 运行完整质量门禁                      |

## 🧪 测试

测试分两部分：

- `eslint/__tests__/`：RuleTester 用例，验证规则行为与边界
- `src/**/__tests__/`：请求层与示例组件用例

CI 在 `.github/workflows/ci.yml` 中直接执行：

```bash
pnpm run verify
```

## 👨‍💻 开发

- 提交前会经过 husky / lint-staged
- `pre-push` 会执行完整 `verify`
- GitHub Actions 是当前 CI 真正的质量基线
- `.gitlab/merge_request_templates/Default.md` 仅用于 MR 描述模板，不承担 CI 职责

## 📄 License

[MIT](./LICENSE) © Lyndon
