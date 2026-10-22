# @lyndon/frontend-code-spec

> **前端代码规范的源头仓库**：把代码该怎么写沉淀成能执行的 ESLint 规则与能照抄的范式样板，让业务仓库对齐标准，而不是靠口头约定和 Code Review 反复纠正。

[![CI](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml) ![Node](https://img.shields.io/badge/node-%3E%3D22.13.0-339933?logo=node.js&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-10.12.4-F69220?logo=pnpm&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white) ![Coverage](https://img.shields.io/badge/coverage%20threshold-95%25-brightgreen) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 📖 这个仓库解决什么问题

代码规范通常有两种形态：一份没人看的文档，或者一堆记在几个人脑子里的默契。两者都会在人员流动和项目增多时失效。

这个仓库把规范拆成两半，各用它该用的形式落地：

- **能机器判定的，写成规则**。`eslint/` 是一套 ESLint 配置——社区规则优先、社区缺的再自研，按 14 组主题配置组织，管注释形态、命名、解构位置、模块边界、类型安全。写错了在编辑器里就红，不必等到 Review。
- **判不了的，给一份能抄的实现**。`src/` 是范式样板，主体是一套完整的请求层：实例复用、拦截器编排、重试与去重、错误归一与提示、埋点上报。它示范的是在这套规则约束下代码长什么样。

仓库声明为 `private: true`，不发布 npm 包——它的定位是**源头**：业务仓库照它落地 lint 配置、对照它写代码。这套规则同时作用于仓库自身——根 `eslint.config.js` 直接引用 `eslint/index.js`，`src/` 与 `eslint/` 全量受约束，所以规则一改，立刻能在样板代码上验证是否讲得通。

## ✨ 特性

- 🧩 **13 条自研规则**，只补社区规则缺的形态，每条都配 `RuleTester` 单测，规则语义有用例兜底而非靠描述。
- 🧵 **全链路 lint**：ESLint 管代码、Prettier 管格式、Stylelint 管样式、ls-lint 管文件名、zhlint 管中文排版、sort-package-json 管清单字段顺序，各管一段互不重叠。
- 🛡️ **提交、推送双闸门**：`pre-commit` 走 lint-staged 增量修复，`pre-push` 跑与 CI 同款的全量校验，外加分支名与 commit message 校验。
- 🌐 **请求层范式样板**：实例按 `serviceCode` 复用、拦截器顺序固定、重试与去重、凭证只发往本服务、错误静默与抛出策略，全部有单测覆盖。
- 🎯 **覆盖率红线 95%**：statements、lines、branches、functions 四项阈值齐平，CI 卡口。
- 🔒 **TypeScript 严格档**：`strict` 之外还开了 `noUncheckedIndexedAccess`、`noImplicitReturns`；业务代码里 `as` 断言与非空断言一并禁用，只有测试造桩豁免。

## 📦 环境要求

| 项目 | 版本                                       |
| ---- | ------------------------------------------ |
| Node | `>=22.13.0`（`.nvmrc` 锁定 `22.22.2`）     |
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

| 命令                 | 作用                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm verify`        | 全量质量校验：类型、各类 lint、格式、测试与覆盖率门禁一次跑完；pre-push 与 CI 跑的就是这条命令 |
| `pnpm type-check`    | `tsc --noEmit` 类型检查                                                                        |
| `pnpm lint`          | ESLint 检查全仓                                                                                |
| `pnpm lint:fix`      | ESLint 自动修复                                                                                |
| `pnpm lint:filename` | ls-lint 校验文件与目录命名                                                                     |
| `pnpm lint:style`    | Stylelint 检查 SCSS 与 CSS                                                                     |
| `pnpm lint:md`       | zhlint 检查 Markdown 中文排版                                                                  |
| `pnpm lint:pkg`      | 校验 `package.json` 字段顺序                                                                   |
| `pnpm format`        | Prettier 格式化全仓                                                                            |
| `pnpm format:check`  | Prettier 检查全仓格式（范围由 `.prettierignore` 与 `.gitignore` 收口）                         |
| `pnpm test`          | Vitest 监听模式                                                                                |
| `pnpm test:cov`      | 单次运行并出覆盖率报告，覆盖率不达阈值即失败                                                   |

`lint:style` 与 `lint:md` 各有对应的 `:fix`；`package.json` 的字段顺序由 `pre-commit` 阶段的 `sort-package-json` 直接整理，无需手动执行。

## 📂 目录结构

```text
├── eslint/                     自定义 ESLint 插件
│   ├── configs/                14 组主题配置，按关注点挂载内置规则与自研规则
│   ├── docs/rules/             每条自研规则的说明：管什么、为什么、正反例、选项
│   ├── rules/                  自研规则实现，按主题分目录
│   ├── utils/                  规则共用判定：豁免文件、posix 路径、源码分层、规则文档地址、预设升级
│   ├── __tests__/              规则单测与共用的 RuleTester 封装
│   └── index.js                插件与全部分组配置的聚合入口
├── src/                        范式样板
│   ├── apis/                   请求层：request 工厂、拦截器、重试去重、服务定义、类型
│   ├── components/             组件样板（flight-card）
│   ├── constants/              环境枚举与构建期注入键
│   └── utils/                  环境判定与可替换实现槽，均可由业务侧注入
├── .husky/                     pre-commit / pre-push / commit-msg 钩子
├── .github/workflows/ci.yml    CI 流水线，安装依赖后跑 pnpm verify
├── eslint.config.js            仓库自身的 ESLint 配置，引用 eslint/index.js
├── .ls-lint.yml                文件名规范：kebab-case，放行 __tests__ 与 useXxx
├── .stylelintrc.js             SCSS/CSS 规范：CSS Modules camelCase、选择器最多 3 层、颜色与间距走 token、z-index 收口
├── prettier.config.js          格式化：100 列、单引号、尾逗号
├── commitlint.config.js        commit message 规范
├── lint-staged.config.js       暂存区增量校验，改写为相对路径后再交给各 linter
├── vitest.config.ts            双 project 测试与覆盖率阈值
├── AGENTS.md                   agent 工具读取本仓库约定的入口
└── CLAUDE.md                   Claude Code 的入口，只导入 AGENTS.md
```

## 📐 规则集

`eslint/configs/` 按关注点分成 14 组，由 `eslint/index.js` 聚合后导出，同时挂载 ESLint、typescript-eslint、import-x、@eslint-react、react-hooks、jsx-a11y-x、no-unsanitized、eslint-comments、unicorn、sonarjs、regexp、promise、check-file、no-barrel-files 的规则与本仓自研规则。typescript-eslint 的 `strictTypeChecked` 与 `stylisticTypeChecked`、react-hooks 的 `recommended-latest`、@eslint-react 的 `recommended-type-checked`、jsx-a11y-x 与 regexp 的 `recommended` 整套启用，预设里的 warn 一律按 error 生效：

| 分组                | 关注点                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `declaration`       | 声明与比较：`eqeqeq`、`prefer-const`、`no-var`、参数不重赋值、参数个数上限、重复函数体、无用展开                             |
| `control-flow`      | 禁 Promise 链、分支体带大括号、嵌套三元、`else return`、最大深度、认知复杂度 15、可合并的 if、抛错带 `new` 与 message        |
| `logging`           | `console` 只放行 `warn` / `error`                                                                                            |
| `imports`           | 导入分组排序与组间空行、循环依赖、重复导入、内置模块写 `node:` 前缀、公共层不引用 `pages`                                    |
| `comments`          | 注释风格、不留被注释掉的代码；`eslint-disable` 必须点名规则、写 `-- 理由`、成对关闭，未使用即报                              |
| `destructuring`     | 解构位置：不在签名解构，模块级解构提到顶层                                                                                   |
| `typescript`        | typescript-eslint 严格与风格预设，加类型导入风格、`strict-boolean-expressions`、断言收紧；测试文件放宽 `no-unsafe-*` 等 8 条 |
| `naming`            | `naming-convention` 全量约定（布尔量带前缀且不接 `Not`，集合不挂 `Array` / `List` 后缀）、文件名黑名单，加自研命名规则       |
| `react`             | react-hooks 与 @eslint-react 推荐集（key、组件内定义组件、条件渲染泄漏等），加 Props 命名与箭头包裹约束                      |
| `structure`         | 模块边界：相对路径与 `@/` 别名、禁 barrel、默认导出方向                                                                      |
| `security`          | 禁 `eval` 与 `new Function`、`javascript:` URL、`dangerouslySetInnerHTML`，未净化内容不进 `innerHTML`                        |
| `accessibility`     | jsx-a11y-x 推荐集：替代文本、可聚焦性、键盘事件、ARIA 取值                                                                   |
| `restricted-syntax` | 受限语法：catch 不能为空或只打日志、src 不写死内网地址、`persist` 必须列白名单、不用 try 包 JSX                              |
| `rule-authoring`    | 写自研规则：regexp 推荐集，只对 `eslint/` 生效                                                                               |

分组按**关注点**而非语言名划分。这一点是有意的：如果存在一个叫 `javascript` 的分组，那么任何一条内置规则放进去都不别扭，边界就失效了——下次新增规则时两个分组都讲得通，等于没有标准。按关注点分，每条规则的落点只有一个答案。

13 条自研规则如下，配置里的前缀统一为 `custom/`，每条的说明在 `eslint/docs/rules/<规则名>.md`，报错信息里的链接直达。社区已有等价规则的一律用社区版，表里只留社区版覆盖不到的规则，最后一列写明社区版缺的形态：

| 规则                               | 作用                                                                                                          | 生效范围      | 社区版缺什么                                                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `comment-style`                    | 按导出语义定注释风格：`export` 上方用 `/** */`，其余单行用 `//`、多段用 `/* */`                               | 全仓          | `@stylistic/line-comment-position`、`no-inline-comments`、`@stylistic/multiline-comment-style`、`jsdoc/convert-to-jsdoc-comments` 组合起来也不区分导出与非导出：非导出处的单行 `/* */` 不改 `//`、`/** */` 不降为 `/* */`、连续多段 `/* */` 不合并；`no-inline-comments` 还会把 `foo(/* name */ 'bar')` 这类参数注释报错 |
| `no-param-destructuring`           | 禁在函数签名解构，改在函数体内解构                                                                            | js / ts / tsx | 核心、typescript-eslint、unicorn、sonarjs 都没有约束形参解构的规则，`prefer-destructuring` 一类方向相反                                                                                                                                                                                                                  |
| `hoist-module-scope-destructuring` | 模块级 `const` 绑定的解构提到模块顶层；可重新赋值的 `let` 不报，提上去会改变求值时机                          | js / ts / tsx | 没有对应规则，`unicorn/prefer-smaller-scope` 方向相反                                                                                                                                                                                                                                                                    |
| `no-handle-prefix`                 | 禁 `handle` 前缀，改用语义化动词（`saveData` 而非 `handleClick`），覆盖 `useCallback` 包裹的声明              | js / ts / tsx | `@typescript-eslint/naming-convention` 靠类型信息区分函数值，`.js` 跑不了；`useCallback` 包裹的声明在类型推不出时漏报，带引号的键 `"handleClick"` 会被误报                                                                                                                                                               |
| `no-generic-param-name`            | 禁参数用泛化命名，改用具体领域词汇                                                                            | js / ts / tsx | `naming-convention` 只能挂 TS 解析器，`.js` 不覆盖；`id-denylist` 连带报外部契约字段（`response.data`、`context.report({ data })`）；`unicorn/name-replacements` 按单词匹配，`userData` 这类复合名也报                                                                                                                   |
| `no-internal-on-prefix`            | `on` 前缀只留给 Props 回调声明，内部函数不用                                                                  | js / ts / tsx | `naming-convention` 要靠类型信息筛出函数值，`.js` 不覆盖                                                                                                                                                                                                                                                                 |
| `ref-suffix-naming`                | `useRef` 声明的变量必须以 `Ref` 结尾                                                                          | `src/`        | `@eslint-react/naming-convention-ref-name` 放行裸 `ref`                                                                                                                                                                                                                                                                  |
| `require-unit-suffix`              | 数值量纲字段带单位后缀，如 `feeCents`、`timeoutMs`；金额 / 时长 / 时间点 / 长度 / 数据量 / 质量各配自己的单位 | `src/`        | 没有按量纲要求单位后缀的规则                                                                                                                                                                                                                                                                                             |
| `status-field-naming`              | 状态上下文的数据与异步状态字段用后缀式命名：`isLoadingXxx` / `xxxError`                                       | `src/`        | `naming-convention` 没有「状态上下文」判定，`errorHandler`、`loadingSpinner` 这类非状态命名也会报                                                                                                                                                                                                                        |
| `props-interface-naming`           | Props 接口必须命名为「组件名 + Props」；已导出的接口只报不修，改名会断掉导入方                                | tsx           | 没有把 Props 接口名与组件名绑定的规则                                                                                                                                                                                                                                                                                    |
| `no-unnecessary-arrow-wrapper`     | 禁多余的箭头包裹，`onClick={() => fn()}` 应改为 `onClick={fn}`；只报不修，去掉包裹会改变实收实参个数          | tsx           | 没有针对 JSX 事件属性多余箭头包裹的规则                                                                                                                                                                                                                                                                                  |
| `import-path-boundary`             | 模块内部走相对路径，跨模块走 `@/` 别名；`containerDirs`（默认 `pages`）下每个子目录各算一个模块               | `src/`        | `import-x/no-relative-parent-imports`、`no-relative-import-paths`、`boundaries` 只管一个方向或只看依赖关系；`no-restricted-imports` 要按目录逐块手写正则，新目录不受约束，也没有 autofix                                                                                                                                 |
| `require-tsx-default-export`       | TSX 必须有 `export default`                                                                                   | `src/`        | `import-x/prefer-default-export`（`target: 'any'`）在文件含类型导出（如 `export interface FooProps`）或 `export *` 时不报                                                                                                                                                                                                |

以下社区规则替代了原自研规则：开启 `strict: true` 的 `promise/prefer-await-to-then` 替代 `no-promise-chain`，`@typescript-eslint/prefer-enum-initializers` 替代 `require-enum-initializer`，`check-file/filename-blocklist` 替代 `no-implementation-suffix-filename`，`no-barrel-files/no-barrel-files` 与 `check-file/no-index` 替代 `no-barrel`，`import-x/no-default-export` 替代 `no-ts-default-export`。

命名与结构类规则依赖 `src` 的分层与 `@/` 别名，因此只对 `src/` 源码开启，生效范围由 `eslint/utils/source-layout.js` 的 `SRC_FILE_GLOBS` 统一给出——规则的路径推断与生效范围必须指同一个目录才成立，不在各 config 里裸写。测试文件等场景由 `eslint/utils/is-exempt-file.js` 的豁免清单统一放行，避免为造桩、断言的写法反复加 `eslint-disable`。

**三条规则刻意不提供 autofix**，因为自动改写会改变行为：`no-unnecessary-arrow-wrapper` 去掉包裹后，发射方多传的实参会静默落进被调函数的可选形参；`props-interface-naming` 遇到已导出的接口时改名会让导入方编译失败；`hoist-module-scope-destructuring` 对 `let` 绑定直接放行而不是建议搬移。能自动修的前提是改写前后等价，不等价就只报不修，把判断交回给人。

## 🌐 请求层范式

`src/apis/` 是一份可直接照搬的请求层实现，约定集中在几处：

- **实例按 `serviceCode` 复用**，`baseURL` 由环境与 `serviceCode` 生成；同一 `serviceCode` 第二次传入不同实例级配置时，开发环境会告警而非静默覆盖。
- **拦截器顺序固定**：请求侧埋点 → 鉴权；响应侧网络错误归一 → 登录态 → 业务码拆包 → 上报。
- **凭证只发往本服务**：注入 `Authorization` 前比对目标 origin 与实例 `baseURL`。axios 在 url 为绝对地址时会跳过 `baseURL`，不做这层比对，一次指向第三方域的调用就会把 token 与凭据 cookie 一起送出去。
- **重试只对可安全重放的场景生效**：网络错误、超时、5xx；POST 需显式声明 `isIdempotent`，重试期间复用同一 `requestId`；退避有封顶值，避免尾部重试把请求挂住几十秒。
- **去重按 `serviceCode` + method + url + 参数**签名，新请求发出时取消同签名的在飞请求；参数无法稳定序列化的请求自动不参与去重，判定递归到嵌套层，`FormData`、`Blob` 与循环引用都能识别。
- **错误默认被吞掉并返回 `null`**，需要自行处理时用 `isErrorSwallowed: false`。**取消是例外，它一律上抛**——否则调用方无法区分请求失败与请求已被同签名新请求接替，把后者按失败渲染空态是错的。
- **埋点留了脱敏钩子**：上报载荷含完整请求参数与响应体，生产侧先过 `setAnalyticsSanitizer` 注入的脱敏函数再交给 sender。

错误处置策略作为可选入参透传，而不是为每种组合各写一个孪生函数——url 与响应类型因此只维护一处：

```ts
const get = createGetRequest('33251');

// 列表：挡住同一筛选条件的连续触发，失败重试两次
export const fetchFlights = (query: FlightListParams) =>
  get<FlightListResult>({
    url: FLIGHT_LIST_URL,
    params: query,
    isDeduped: true,
    retry: { count: 2 },
  });

// 详情：默认「提示 + 吞错返回 null」，需要别的策略时由调用方传
export const fetchFlightDetail = (flightNo: string, errorHandling?: ErrorHandling) =>
  get<FlightDetail>({ url: FLIGHT_DETAIL_URL, params: { flightNo }, ...errorHandling });

await fetchFlightDetail('CA1234'); // 默认：失败弹提示、返回 null
await fetchFlightDetail('CA1234', SILENT_ERROR_HANDLING); // 全静默，自己读返回值
await bookFlight(payload, THROWN_ERROR_HANDLING); // 错误抛给调用方自己接
```

**依赖外部实现的地方一律走可替换槽**，实现见 `src/utils/swappable.ts`。token 读取、错误提示、埋点发送、环境判定、埋点脱敏都有对应的 `setXxx` 与 `resetXxx`。这样拦截器不直接依赖 UI 库或具体存储，业务侧换实现不必改本层代码；模式本身要演进，比如覆盖时告警、生产禁止覆盖，也只改一处。

## 🧪 测试

Vitest 分成两个 project，环境各按所需选取：

| project         | 环境  | 覆盖范围                                         |
| --------------- | ----- | ------------------------------------------------ |
| `eslint-rules`  | node  | `eslint/__tests__/`，纯静态分析，省掉 jsdom 开销 |
| `request-layer` | jsdom | `src/**/__tests__/`，请求层依赖 `window`         |

规则测试统一用 `eslint/__tests__/support/rule-tester.js` 封装的 `RuleTester`，统一挂 TS parser，TS 与 JSX 用例一并覆盖。覆盖率统计 `eslint/**/*.js` 与 `src/**/*.{ts,tsx}`，`__tests__` 不计入，四项阈值均为 95%，以 `pnpm test:cov` 的门禁为准。

```bash
pnpm test        # 监听模式
pnpm test:cov    # 单次运行 + 覆盖率
```

## 👨‍💻 开发约定

**Commit message** 走 conventional commits，`type` 限定在 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`revert`、`build`、`ci`，header 不超过 120 字符。类型按改动的性质分，模块信息走 scope，例如 `feat(eslint):`。

**分支命名**形如 `{类别}/{短描述}`，类别可选 `feature`、`fix`、`hotfix`、`chore`、`refactor`，例如 `feature/payment-flow`；`main`、`master`、`develop` 放行。校验发生在 `pre-push`，且校验的是待推送的远端 ref，绕不开。

**两道钩子**：

- `pre-commit`：lint-staged 按文件类型增量修复，ESLint、Stylelint、zhlint、Prettier、ls-lint、sort-package-json 各就各位。
- `pre-push`：跑一次 `pnpm verify`，与 CI 是同一份检查清单，本地先拦一遍。

## 📄 License

[MIT](./LICENSE) © Lyndon
