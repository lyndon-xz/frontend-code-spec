# @lyndon/frontend-code-spec

> **前端代码规范的源头仓库**：把代码写法沉淀成可执行的 ESLint 规则与范式样板，让业务仓库照着对齐，而不是靠口头约定和 Code Review 反复纠正。

[![CI](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml) ![Node](https://img.shields.io/badge/node-%3E%3D22.12.0-339933?logo=node.js&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-10.12.4-F69220?logo=pnpm&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white) ![Coverage](https://img.shields.io/badge/coverage%20threshold-95%25-brightgreen) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 📖 简介

仓库由两部分组成，一半是机器能判定的禁令，一半是照着抄的样板：

- **`eslint/`：自定义 ESLint 插件**。18 条自研规则加 9 组主题配置，覆盖注释风格、命名、解构、控制流、TypeScript、React、模块结构，能机器判定的约定全部落成规则。
- **`src/`：范式样板**。以请求层为主体，配上组件与环境判定样例，给出规则约束下代码的实际长相。

仓库以 `private: true` 声明，不发布为 npm 包，定位是规则与写法的**源头**：业务仓库照它落地配置、对照它写代码。这套规则同时作用于本仓库自身——根 `eslint.config.js` 直接引用 `eslint/index.js`，`src/` 与 `eslint/` 全量受约束，规则改动能立刻在样板代码上验证。

## ✨ 特性

- 🧩 **18 条自定义规则**，每条都配 `RuleTester` 单测，规则语义有用例兜底。
- 🧵 **全链路 lint**：ESLint 管代码、Prettier 管格式、Stylelint 管样式、ls-lint 管文件名、zhlint 管中文排版、sort-package-json 管清单字段顺序，各管一段互不重叠。
- 🛡️ **提交、推送双闸门**：`pre-commit` 走 lint-staged 增量修复，`pre-push` 跑与 CI 同款的全量校验，外加分支名与 commit message 校验。
- 🌐 **请求层范式样板**：实例按 `serviceCode` 复用、拦截器顺序固定、重试与去重、错误静默与抛出策略，全部有单测覆盖。
- 🎯 **覆盖率红线 95%**：statements、lines、branches、functions 四项阈值齐平，CI 卡口。
- 🔒 **TypeScript 严格档**：`strict` 之外还开了 `noUncheckedIndexedAccess`、`noImplicitReturns`；业务代码里 `as` 断言与非空断言一并禁用，只有测试造桩豁免。

## 📦 环境要求

| 项目 | 版本                                       |
| ---- | ------------------------------------------ |
| Node | `>=22.12.0`（`.nvmrc` 锁定 `22.22.2`）     |
| pnpm | `>=10.12.4`（`packageManager` 已声明版本） |

`.npmrc` 开了 `engine-strict=true`，版本不符会直接装不上，不做静默降级。

## 🚀 快速开始

```bash
# 安装依赖（只用 pnpm，仓库已屏蔽其它包管理器的 lockfile）
pnpm install

# 跑一遍完整质量校验，等价于 CI 与 pre-push 的检查项
pnpm verify
```

## ⌨️ 命令

| 命令                 | 作用                                              |
| -------------------- | ------------------------------------------------- |
| `pnpm verify`        | 全量质量校验：类型、各类 lint、格式、测试一次跑完 |
| `pnpm type-check`    | `tsc --noEmit` 类型检查                           |
| `pnpm lint`          | ESLint 检查全仓                                   |
| `pnpm lint:fix`      | ESLint 自动修复                                   |
| `pnpm lint:filename` | ls-lint 校验文件与目录命名                        |
| `pnpm lint:style`    | Stylelint 检查 SCSS                               |
| `pnpm lint:md`       | zhlint 检查 Markdown 中文排版                     |
| `pnpm lint:pkg`      | 校验 `package.json` 字段顺序                      |
| `pnpm format`        | Prettier 格式化全仓                               |
| `pnpm format:check`  | Prettier 检查 json / yml / md / scss / css / html |
| `pnpm test`          | Vitest 监听模式                                   |
| `pnpm test:cov`      | 单次运行并出覆盖率报告，覆盖率不达阈值即失败      |

`lint:style` 与 `lint:md` 各有对应的 `:fix`；`package.json` 的字段顺序由 `pre-commit` 阶段的 `sort-package-json` 直接整理，无需手动执行。

## 📂 目录结构

```text
├── eslint/                     自定义 ESLint 插件
│   ├── configs/                9 组主题配置，按主题挂载内置规则与自研规则
│   ├── rules/                  18 条自研规则实现，按主题分目录
│   ├── utils/                  规则共用判定：豁免文件、路径归一、源码分层等
│   ├── __tests__/              规则单测与共用的 RuleTester 封装
│   └── index.js                插件与全部分组配置的聚合入口
├── src/                        范式样板
│   ├── apis/                   请求层：request 工厂、拦截器、重试去重、服务定义、类型
│   ├── components/             组件样板（flight-card）
│   ├── constants/              环境枚举与本地域名常量
│   └── utils/                  环境判定，可由业务侧注入 provider
├── .husky/                     pre-commit / pre-push / commit-msg 钩子
├── .github/workflows/ci.yml    CI 流水线，逐项复刻本地校验
├── eslint.config.js            仓库自身的 ESLint 配置，引用 eslint/index.js
├── .ls-lint.yml                文件名规范：kebab-case，放行 __tests__ 与 useXxx
├── .stylelintrc.js             SCSS 规范：CSS Modules camelCase、嵌套 3 层、z-index 收口
├── prettier.config.js          格式化：100 列、单引号、尾逗号
├── commitlint.config.js        commit message 规范
├── lint-staged.config.js       暂存区增量校验，改写为相对路径后再交给各 linter
└── vitest.config.ts            双 project 测试与覆盖率阈值
```

## 📐 规则集

`eslint/configs/` 按主题分成 9 组，由 `eslint/index.js` 聚合后导出，同时挂载 ESLint、`@typescript-eslint`、`import`、`react`、`react-hooks` 的内置规则与本仓自研规则：

| 分组            | 关注点                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `javascript`    | 嵌套三元、`else return`、最大深度与参数个数、`eqeqeq`、`console` 白名单  |
| `imports`       | 导入分组排序与组间空行、循环依赖、重复导入                               |
| `comments`      | 注释风格，并把未使用的 `eslint-disable` 提到 error                       |
| `control-flow`  | 禁 Promise 链式调用，统一 `async` / `await`                              |
| `destructuring` | 解构位置：不在签名解构，模块级解构提到顶层                               |
| `typescript`    | 类型定义与导入风格、`strict-boolean-expressions`、Promise 误用、断言收紧 |
| `naming`        | `naming-convention` 全量约定，加 7 条自研命名规则                        |
| `react`         | JSX 与 Hooks 规则，加 Props 命名与箭头包裹约束                           |
| `structure`     | 模块边界：相对路径与 `@/` 别名、禁 barrel、默认导出方向                  |

18 条自研规则如下，配置里的前缀统一为 `custom/`：

| 规则                                | 作用                                                                            | 生效范围      |
| ----------------------------------- | ------------------------------------------------------------------------------- | ------------- |
| `comment-style`                     | 按导出语义定注释风格：`export` 上方用 `/** */`，其余单行用 `//`、多段用 `/* */` | 全仓          |
| `no-promise-chain`                  | 禁 `.then()` / `.catch()` / `.finally()` 链式调用                               | js / ts / tsx |
| `no-param-destructuring`            | 禁在函数签名解构，改在函数体内解构                                              | js / ts / tsx |
| `hoist-module-scope-destructuring`  | 模块级绑定的解构提到模块顶层，不写在函数体内                                    | js / ts / tsx |
| `no-handle-prefix`                  | 禁 `handle` 前缀，改用语义化动词（`saveData` 而非 `handleClick`）               | js / ts / tsx |
| `no-generic-param-name`             | 禁参数用泛化命名，改用具体领域词汇                                              | js / ts / tsx |
| `no-internal-on-prefix`             | `on` 前缀只留给 Props 回调声明，内部函数不用                                    | js / ts / tsx |
| `ref-suffix-naming`                 | `useRef` 声明的变量必须以 `Ref` 结尾                                            | `src/`        |
| `require-unit-suffix`               | 数值量纲字段带单位后缀，如 `priceCents`、`timeoutMs`                            | `src/`        |
| `status-field-naming`               | 状态上下文的数据与异步状态字段用后缀式命名：`isLoadingXxx` / `xxxError`         | `src/`        |
| `no-implementation-suffix-filename` | 文件名禁实现类后缀（`-modal` / `-type` / `-config` 等），强制业务名词主导       | `src/`        |
| `props-interface-naming`            | Props 接口必须命名为「组件名 + Props」                                          | tsx           |
| `no-unnecessary-arrow-wrapper`      | 禁多余的箭头包裹，`onClick={() => fn()}` 改为 `onClick={fn}`                    | tsx           |
| `import-path-boundary`              | 模块内部走相对路径，跨模块走 `@/` 别名                                          | `src/`        |
| `no-barrel`                         | 禁 barrel 入口：公共库 index 禁存在，其余 index 禁 `export *` 与跨模块重导出    | `src/`        |
| `require-tsx-default-export`        | TSX 必须有 `export default`                                                     | `src/`        |
| `no-ts-default-export`              | TS（非 TSX）禁用 `export default`                                               | `src/`        |
| `require-enum-initializer`          | 枚举成员必须显式赋值，禁自动递增                                                | ts / tsx      |

命名与结构类规则依赖 `src` 的分层与 `@/` 别名，因此只对 `src/` 源码开启；测试文件等场景由 `eslint/utils/is-exempt-file.js` 的豁免清单统一放行，避免为造桩、断言的写法反复加 `eslint-disable`。

## 🌐 请求层范式

`src/apis/` 是一份可直接照搬的请求层实现，约定集中在几处：

- **实例按 `serviceCode` 复用**，`baseURL` 由环境与 `serviceCode` 生成；同一 `serviceCode` 第二次传入不同实例级配置时，开发环境会告警而非静默覆盖。
- **拦截器顺序固定**：请求侧埋点 → 鉴权；响应侧网络错误归一 → 登录态 → 业务码拆包 → 上报。
- **重试只对可安全重放的场景生效**：网络错误、超时、5xx；POST 需显式声明 `isIdempotent`，重试期间复用同一 `requestId`。
- **去重按 `serviceCode` + method + url + 参数**签名，新请求发出时取消同签名的在飞请求；参数无法稳定序列化的请求，如带 `FormData` 的请求，自动不参与去重。
- **错误默认被吞掉并返回 `null`**，需要自行处理时用 `isErrorSwallowed: false`；提示文案可静默或自定义。

```ts
const get = createGetRequest('33251');

// 列表：挡住同一筛选条件的连续触发，失败重试两次
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: '/flight/list',
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

// 下单：不重试不去重，错误交调用方处理
export const bookFlightOrThrow = (payload: BookFlightPayload) =>
  post<BookFlightResult>({
    url: '/flight/book',
    data: payload,
    isErrorSwallowed: false,
    businessError: { isSilent: true },
    networkError: { isSilent: true },
  });
```

## 🧪 测试

Vitest 分成两个 project，环境各按所需选取：

| project         | 环境  | 覆盖范围                                         |
| --------------- | ----- | ------------------------------------------------ |
| `eslint-rules`  | node  | `eslint/__tests__/`，纯静态分析，省掉 jsdom 开销 |
| `request-layer` | jsdom | `src/**/__tests__/`，请求层依赖 `window`         |

规则测试统一用 `eslint/__tests__/support/rule-tester.js` 封装的 `RuleTester`，统一挂 TS parser，TS 与 JSX 用例一并覆盖。覆盖率统计 `eslint/**/*.js` 与 `src/**/*.ts`，四项阈值均为 95%。

```bash
pnpm test        # 监听模式
pnpm test:cov    # 单次运行 + 覆盖率
```

## 👨‍💻 开发约定

**Commit message** 走 conventional commits，`type` 限定在 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`revert`、`build`、`ci`，header 不超过 120 字符。

**分支命名**形如 `{类别}/{短描述}`，类别可选 `feature`、`fix`、`hotfix`、`chore`、`refactor`，例如 `feature/payment-flow`；`main`、`master`、`develop` 放行。校验发生在 `pre-push`，且校验的是待推送的远端 ref，绕不开。

**两道钩子**：

- `pre-commit`：lint-staged 按文件类型增量修复，ESLint、Stylelint、zhlint、Prettier、ls-lint、sort-package-json 各就各位。
- `pre-push`：逐项执行 `type-check`、`lint`、`format:check`、`lint:filename`、`lint:md`、`lint:style`、`lint:pkg`、`test:cov`，与 CI 完全对齐，本地先拦一遍。

## 📄 License

[MIT](./LICENSE) © Lyndon
