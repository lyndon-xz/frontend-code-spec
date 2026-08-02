# @lyndon/frontend-code-spec

> 一个面向前端工程的 **code-spec 仓库**：一半是 **ESLint 自定义规则防线**，一半是 **axios 请求层范式样板**。
> 仓库既给出 “该怎么约束代码”，也给出 “基础设施该怎么落地”。

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-9.39-4B32C3?logo=eslint&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white) ![Node](https://img.shields.io/badge/Node-%3E%3D22.12.0-339933?logo=node.js&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-10.12.4-F69220?logo=pnpm&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-black)

## 📖 简介

这个仓库聚焦两件事：

- `eslint/` 提供 20 条按领域拆分的自定义规则，以及配套的 flat config
- `src/apis/` 提供一套请求层封装范式，覆盖鉴权、SSO、业务码、错误提示、重试、去重、埋点

它更像一个 “可执行规范仓”，而不是单纯的工具箱。规则、示例代码、测试和 CI 是绑在一起演进的：规则约束的写法，仓库自己的源码就是它的第一批被检查对象。

## ✨ 特性

- **规则集按领域组织**：`comments / control-flow / destructuring / naming / react / structure / typescript` 七个域，规则 id 保持扁平 (`custom/<rule-name>`)，领域只体现在源码目录
- **规则与范式同仓维护**：不仅限制怎么写代码，也给出请求层基础设施该怎么写
- **请求层默认带护栏**：错误归一、静默 / 自定义提示、可选重试、请求去重、SSO 跳转、埋点串联
- **可注入扩展点**：错误提示、埋点上报、token 读取都能替换为业务实现
- **质量门禁完整**：type-check、ESLint、Prettier、文件名、Markdown、SCSS、package.json 排序、覆盖率逐项独立成关
- **规则集自校验**：规则源码自身也受那批与技术栈无关的自研规则约束，交付的约定先在自己身上成立
- **规则自带 RuleTester 用例**：20 条规则在实现、注册、配置、测试四处一一对应

## 🧱 技术栈

- **语言**：TypeScript、JavaScript (ESM)
- **Lint**：ESLint 9 flat config、`@typescript-eslint`、`eslint-plugin-react`、`eslint-plugin-react-hooks`、`eslint-plugin-import`
- **格式化**：Prettier (通过 `eslint-plugin-prettier` 进 lint)
- **测试**：Vitest + V8 Coverage + jsdom
- **请求层**：axios、antd (默认错误提示实现)
- **工程化**：pnpm、husky、lint-staged、commitlint、ls-lint、zhlint、GitHub Actions

## 📂 目录结构

```text
.
├── eslint/
│   ├── rules/            # 20 条自定义规则实现，按领域分目录
│   ├── configs/          # 领域配置 + 跨领域共享的基础规则片段
│   ├── utils/            # 规则公共工具: 路径归一、豁免判定、函数节点判定、前缀规则工厂
│   ├── __tests__/        # RuleTester 用例，与 rules 一一对应
│   └── index.js          # 规则注册入口，导出 custom/* 插件与配置数组
├── src/
│   ├── apis/             # 请求层范式
│   │   ├── request.ts    # 实例构建与请求工厂
│   │   ├── interceptors/ # 鉴权、SSO、埋点、业务错误、网络错误
│   │   ├── services/     # 按 serviceCode 组织的示例业务接口
│   │   ├── types/        # 配置与响应信封类型
│   │   ├── utils/        # 错误归一、重试、去重、链路 id、提示与埋点注入点
│   │   └── constants/    # 业务码与服务 host
│   ├── components/       # React dogfood 示例: flight-card
│   ├── constants/        # 环境枚举
│   └── utils/            # 环境判定
├── .github/workflows/    # GitHub Actions CI
├── .husky/               # commit-msg / pre-commit / pre-push 钩子
└── eslint.config.js      # 仓库顶层 flat config 入口
```

## 📦 安装

```bash
pnpm install
```

要求：

- Node：`>=22.12.0` (`.nvmrc` 锁定 `22.22.2`)
- pnpm：`>=10.12.4`

`.npmrc` 开启了 `engine-strict=true`，版本不满足时 `pnpm install` 会直接失败而非只打警告。用 `nvm use` 切到 `.nvmrc` 指定的版本即可。

## 🚀 快速开始

### 跑完整校验

与 CI 完全一致的八道关，逐项执行：

```bash
pnpm run type-check
pnpm run lint
pnpm run format:check
pnpm run lint:filename
pnpm run lint:md
pnpm run lint:style
pnpm run lint:pkg
pnpm run test:cov
```

### 只跑测试

```bash
pnpm run test
pnpm run test:cov
```

### 只跑 ESLint

```bash
pnpm run lint
pnpm run lint:fix
```

## 🛠️ 使用

### 规则清单

仓库顶层 `eslint.config.js` 把 `eslint/index.js` 里的规则注册到 `custom/*` 命名空间，自研规则集当前只作用于 `.ts` / `.tsx`。

**comments**

- `custom/comment-style` — 按导出语义强制注释风格：export 上方用 `/** */`，其余位置单行用 `//`、多行用 `/* */`；注释须在目标代码上方独占一行

**control-flow**

- `custom/no-promise-chain` — 禁止 `.then()` / `.catch()` / `.finally()` 链式调用，统一 async/await

**destructuring**

- `custom/no-param-destructuring` — 禁止在函数签名中解构，改在函数体内解构

**naming**

- `custom/no-generic-param-name` — 禁止参数用泛化命名，改用具体领域词
- `custom/no-handle-prefix` — 禁止 `handle` 前缀，改用语义化动词 (`saveData` 而非 `handleClick`)
- `custom/no-internal-on-prefix` — `on` 前缀只留给 Props 回调声明，内部函数用语义化动词
- `custom/no-implementation-suffix-filename` — 文件名禁用实现类后缀 (`-modal` / `-type` / `-config` / `-util(s)` 等) 与纯实现整名，强制业务名词主导
- `custom/ref-suffix-naming` — `useRef` 声明的变量必须以 `Ref` 结尾
- `custom/status-field-naming` — 状态上下文 (`useState` / `State` 类型 / 状态对象) 里的状态字段强制后缀式命名 (`isLoadingXxx` / `xxxError`)，禁止前缀式
- `custom/require-unit-suffix` — 类型成员里的数值量纲字段 (金额 / 时长 / 尺寸) 必须带单位后缀，如 `priceCents`、`timeoutMs`

**react**

- `custom/no-unnecessary-arrow-wrapper` — 禁止不必要的箭头函数包裹，`onClick={() => fn()}` 应写成 `onClick={fn}`
- `custom/props-interface-naming` — Props 接口必须命名为 `组件名 + Props`

**structure**

- `custom/file-element-order` — 文件内元素按 “类型 → 常量 → 辅助函数 → 主导出” 排列
- `custom/import-path-boundary` — 模块内部走相对路径，跨模块走 `@/` 别名
- `custom/no-barrel` — 禁止 barrel 入口：公共库 index (含 `apis/utils` 这类深层公共库) 禁文件存在，其余 index 禁 `export *` 与跨模块重导出
- `custom/no-component-sidecar-files` — 禁止 `components/<name>/` 下出现 `constants.ts` / `utils.ts` / `types.ts`，旁路文件应内联或上提模块级
- `custom/no-direct-http-client` — 请求层之外禁止直连 HTTP 客户端 (`import axios`、`fetch`、`new XMLHttpRequest`)，必须走 apis 层统一出口
- `custom/no-ts-default-export` — `.ts` 文件不允许 `export default`
- `custom/require-tsx-default-export` — `.tsx` 文件必须有 `export default`

**typescript**

- `custom/require-enum-initializer` — 禁止自动递增枚举，每个成员必须显式赋值

带 options 的规则可按需收窄或放宽，例如 `no-generic-param-name` 默认黑名单是 `data` / `callback` (`params` / `options` 在请求与配置场景常见，不纳入默认集)：

```js
{
  rules: {
    'custom/no-generic-param-name': ['error', { bannedNames: ['data', 'callback', 'params'] }],
  },
}
```

### 请求层范式

在 `src/apis/services/` 里按 `serviceCode` 创建请求函数，再封装业务接口。工厂提供 `createRequest` 与 `createGetRequest` / `createPostRequest` / `createPutRequest` / `createDeleteRequest`。

baseURL 由 `serviceCode` 生成 (形如 `{host}/api/{serviceCode}`)，所以 service 里的 `url` 只写网关之后的业务路径，不要再带 `/api` 前缀：

```ts
import { createGetRequest, createPostRequest } from '@/apis/request';

const FLIGHT_SERVICE_CODE = '33251';
const get = createGetRequest(FLIGHT_SERVICE_CODE);
const post = createPostRequest(FLIGHT_SERVICE_CODE);

export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2, delayMs: 300 },
  });

export const bookFlight = (payload: BookFlightPayload) =>
  post<BookFlightResult>({ url: '/flight/book', data: payload });
```

默认行为：

- 成功时返回拆包后的 `data`，无 `data` 时归一为 `null`
- 失败时默认返回 `null`；传 `isErrorSwallowed: false` 改为抛出 `RequestError`
- `businessError` / `networkError` 可分别配置静默或自定义提示文案
- `retry` 只对可重试错误生效 (网络不可达、超时、5xx；4xx、业务错误与未知异常不重试)，重试期间只在最终失败时提示一次
- `isDeduped` 会取消上一个同签名在飞请求 (签名含 `serviceCode`，跨服务同路径互不影响)；调用方自带 `signal` 时不接管取消控制
- 被取消的请求在默认吞错下同样返回 `null`，需要区分 “取消” 与 “失败” 时用 `isErrorSwallowed: false`，按 `error.type === RequestErrorType.Canceled` 判断
- 同一业务请求的多次重试共用一个链路 id，埋点侧可串成一条记录

## ⚙️ 配置

### 请求层扩展点

请求层的外部依赖都做成了可替换实现：

| 扩展点                                                    | 作用                       |
| --------------------------------------------------------- | -------------------------- |
| `setErrorNotifier()` / `resetErrorNotifier()`             | 替换默认错误提示实现       |
| `setAnalyticsSender()` / `resetAnalyticsSender()`         | 替换生产环境埋点上报实现   |
| `setAuthTokenProvider()` / `resetAuthTokenProvider()`     | 替换默认 token 读取实现    |
| `resetSsoRedirectState()`                                 | 取消登录回流后复位跳转状态 |
| `setEnvironmentProvider()` / `resetEnvironmentProvider()` | 替换环境判定实现           |

### 实例级配置

`createRequest()` 与各 HTTP 方法工厂都支持第三个参数传实例级选项：

```ts
const get = createGetRequest('33251', {
  timeout: 5000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
```

同一 `serviceCode` 在运行期只创建一个 axios 实例；若后续再用不同实例级配置创建，开发环境会给出配置漂移告警。

### 环境判定

默认按 “构建期注入的 `APP_ENV` → 浏览器域名兜底 → 取不到 `window` 时按生产” 三级判定，因此 SSR 与 Node 脚本下不会抛错，本地回环网段、`0.0.0.0`、`::1` 与 `.local` 自签域名都算开发环境。

构建期变量的读法随框架而异 (`import.meta.env` / `process.env` / 全局常量)，请求层不绑定具体构建工具，需要精确控制时用 `setEnvironmentProvider()` 注入：

```ts
setEnvironmentProvider(() =>
  import.meta.env.PROD ? Environment.Production : Environment.Development,
);
```

## 💡 示例

### 静默错误提示

```ts
get<FlightDetail>({
  url: '/flight/detail',
  params: { flightNo },
  businessError: { isSilent: true },
  networkError: { isSilent: true },
});
```

### 自定义业务错误文案

```ts
get<FlightDetail>({
  url: '/flight/detail',
  params: { flightNo },
  businessError: { customMessage: '获取航班信息失败，请稍后重试' },
});
```

### 调用方自行处理错误

```ts
post<BookFlightResult>({
  url: '/flight/book',
  data: payload,
  isErrorSwallowed: false,
  businessError: { isSilent: true },
  networkError: { isSilent: true },
});
```

## ⌨️ 脚本

| 命令                      | 说明                                  |
| ------------------------- | ------------------------------------- |
| `pnpm run type-check`     | 运行 TypeScript 类型检查              |
| `pnpm run lint`           | 运行 ESLint                           |
| `pnpm run lint:fix`       | 自动修复 ESLint 可修项                |
| `pnpm run lint:filename`  | 运行 ls-lint 检查文件与目录命名       |
| `pnpm run lint:md`        | 运行 zhlint 检查 Markdown             |
| `pnpm run lint:md:fix`    | 自动修复 Markdown 中文排版            |
| `pnpm run lint:style`     | 运行 Stylelint 检查 SCSS              |
| `pnpm run lint:style:fix` | 自动修复 SCSS 可修项                  |
| `pnpm run lint:pkg`       | 检查 package.json 字段顺序            |
| `pnpm run format`         | 用 Prettier 格式化仓库                |
| `pnpm run format:check`   | 检查 json/yml/md/scss/css/html 的格式 |
| `pnpm run test`           | 运行 Vitest (watch)                   |
| `pnpm run test:cov`       | 单次运行并输出覆盖率                  |

## 🧪 测试

测试分两个 vitest project，环境按需要区分：

- `eslint-rules` (`eslint/__tests__/`)：RuleTester 用例，纯静态分析，跑在 node 环境
- `request-layer` (`src/**/__tests__/`)：请求层与示例组件用例，部分依赖 `window`，跑在 jsdom 环境

请求层的测试同样分两层：`request.test.ts` 把 axios 实例整体替换成假对象，只验证 `createRequest` 的编排；`interceptor-chain.test.ts` 保留真实 axios 与全部拦截器、只换掉最底层 adapter，用来守住跨拦截器的契约 (重试期间的提示抑制、失败埋点、响应拆包)——这类契约在实例被 mock 掉时无人校验。

覆盖率门槛在 `vitest.config.ts` 里设为语句 / 行 / 分支 / 函数各 95%，低于门槛直接失败。

## 👨‍💻 开发

- `pre-commit` 走 lint-staged：按文件类型分别跑 ls-lint、`eslint --fix`、`stylelint --fix`、`zhlint --fix`、Prettier 与 `sort-package-json`
- `commit-msg` 走 commitlint，遵循 Conventional Commits
- `pre-push` 先校验待推送的每个分支名 (`{feature|fix|hotfix|chore|refactor}/{短描述}`，校验的是 push 的目标 ref 而非当前 HEAD)，再逐项执行与 CI 相同的八道校验
- CI 在 `.github/workflows/ci.yml` 中把每道校验拆成独立 step，失败时可直接定位到具体环节
- GitHub Actions 是当前 CI 真正的质量基线；`.gitlab/merge_request_templates/Default.md` 仅用于 MR 描述模板，不承担 CI 职责

## 📄 License

[MIT](./LICENSE) © Lyndon
