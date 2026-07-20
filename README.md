# @lyndon/frontend-code-spec

> 整个前端的 **code-spec**：一条 **AST 强干预**的 ESLint 规则防线，加上一套**请求层基础设施范式**，并用真实 TS 代码作为规则的练兵场。

[![CI](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml/badge.svg)](https://github.com/lyndon-xz/frontend-code-spec/actions/workflows/ci.yml) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white) ![Node](https://img.shields.io/badge/node-%5E20.19%20%7C%7C%20%3E%3D22.12-339933?logo=node.js&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.12.4-F69220?logo=pnpm&logoColor=white) ![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📖 简介

本仓库把一个前端团队的编码规范沉淀成**可执行的代码**，而非一纸文档。它由两块互相印证的内容组成：

- 🛡️ **规范防线** —— 一组手写 AST Visitor 的自研 ESLint 规则，配合分领域的规则配置，把命名、注释、文件组织、导入边界等约定变成 CI 里能拦住 MR 的硬约束。
- 📡 **请求层范式** —— `src/apis` 下一套基于 axios 的请求基础设施 (单例实例、拦截器流水线、无异常返回模型)，既是可参考的工程范式，也是上面规则集的**真实 TS 练兵场**。

`eslint.config.js` 对这两部分区别对待：`src` 下的真实 TS 代码套用完整领域规则集 (规则的靶场)，`eslint` 下的规则源码只用基础规则 + Prettier 校验，其行为正确性由 RuleTester 用例保证。

## ✨ 特性

- **9 条自研 ESLint 规则**，全部手写 AST Visitor，覆盖命名、注释、结构与导入边界。
- **分领域规则配置**：base / typescript / naming / react / import / testing 六个维度独立组装。
- **原子 AST 配置规则**：base / import / naming / typescript / testing 五组节点级约束。
- **请求层基础设施**：`serviceCode` 维度的 axios 单例、有序拦截器流水线、成功返回数据 / 失败返回 `null` 的无异常模型。
- **全链路质量门禁**：类型检查、ESLint、Prettier、Stylelint、文件名规范 (ls-lint)、中文文案 (zhlint)、覆盖率测试一次 `verify` 全跑。
- **提交期防护**：husky + lint-staged + commitlint，在提交与推送阶段就地拦截问题。

## 🛡️ 规则防线

`eslint/rules` 下的自研规则 (在插件命名空间 `custom` 下注册)：

| 规则                                | 作用                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `comment-style`                     | 约束注释风格，区分导出文档注释与被注释掉的代码                                                                       |
| `file-element-order`                | 强制文件内元素按「类型 → 常量 → 辅助函数 → 主导出」排列（仅报错不自动修复）                                          |
| `import-path-boundary`              | 模块内部用相对路径，跨模块引用用 `@/` 别名                                                                           |
| `no-implementation-suffix-filename` | 文件名禁用 `-modal`/`-type`/`-config`/`-util(s)` 等实现类后缀与 `columns`/`form-config` 纯实现整名，强制业务名词主导 |
| `no-should-prefix`                  | `it()` 描述禁止以 `should` 开头                                                                                      |
| `no-unnecessary-arrow-wrapper`      | 禁止不必要的箭头函数包裹（`onClick={() => fn()}` → `onClick={fn}`）                                                  |
| `prefer-object-destructuring`       | 同一对象访问的不同属性数超过阈值时，强制改用解构赋值                                                                 |
| `props-interface-naming`            | Props 接口必须使用「组件名 + Props」命名格式                                                                         |
| `status-field-naming`               | 状态字段强制后缀式命名（`loadingXxx` → `isLoadingXxx`、`errorXxx` → `xxxError`）                                     |

`eslint/configs` 下按领域组装的规则配置，与 `eslint/ast` 下的原子 AST 约束，共同构成 `eslint/index.js` 导出的完整规则集。

## 📡 请求层范式

`src/apis` 提供一套请求层封装，核心是 `request.ts` 里的 `createPostRequest`：

- **单例复用**：同一 `serviceCode` 在运行期只创建一个 axios 实例，首次配置即固定配置。
- **拦截器流水线**：响应阶段按 network (网络异常) → sso (登录态) → business (业务码) → analytics (埋点) → wrapper (异常兜底) 顺序执行。
- **无异常返回模型**：成功返回数据，失败返回 `null`，自动错误提示、自动埋点、自动 SSO 跳转。

配套的 `services` / `types` / `constants` / `utils` 划分了服务定义、类型契约、业务码常量与拦截器实现。

## 📂 目录结构

```
.
├── eslint/                     规则集交付物
│   ├── rules/                  9 条自研 ESLint 规则（手写 AST Visitor）
│   ├── configs/                分领域规则配置（base/typescript/naming/react/import/testing）
│   ├── ast/                    原子 AST 配置规则（节点级约束）
│   ├── utils/                  规则辅助工具（如 is-exempt-file）
│   ├── __tests__/              规则的 RuleTester 用例
│   └── index.js                规则集总入口（注册插件 + 组装配置）
├── src/                        真实 TS 练兵场
│   ├── apis/                   请求层基础设施
│   │   ├── request.ts          请求工厂（单例 + 拦截器流水线）
│   │   ├── services/           业务服务定义
│   │   ├── types/              请求/响应/拦截器类型契约
│   │   ├── constants/          业务码等常量
│   │   ├── utils/              base-url、guards、拦截器实现
│   │   └── __tests__/          请求层测试
│   ├── components/             示例组件
│   ├── constants/              全局常量
│   └── utils/                  通用工具
├── eslint.config.js            仓库自身的 ESLint 扁平配置
├── vitest.config.ts            测试配置
└── tsconfig.json               TypeScript 配置
```

## 🧱 技术栈

- **语言 / 类型**：TypeScript 5.9
- **规则引擎**：ESLint 9 (Flat Config)+ `@typescript-eslint`
- **框架**：React 19 + Ant Design 6
- **请求**：axios
- **测试**：Vitest 4 + jsdom + v8 coverage
- **质量工具**：Prettier、Stylelint、ls-lint、zhlint、sort-package-json
- **提交流程**：husky + lint-staged + commitlint
- **包管理**：pnpm 10.12.4

## 🚀 快速开始

环境要求 (见 `package.json` 的 `engines`)：Node `^20.19.0 || >=22.12.0`，pnpm `>=10.12.4`。

```bash
# 安装依赖
pnpm install

# 一键跑通全部质量校验（等同 CI）
pnpm run verify
```

## ⌨️ 脚本

| 命令                               | 说明                                         |
| ---------------------------------- | -------------------------------------------- |
| `pnpm run lint`                    | 运行 ESLint（含全部自研规则）                |
| `pnpm run lint:fix`                | ESLint 自动修复                              |
| `pnpm run lint:filename`           | ls-lint 文件名规范校验                       |
| `pnpm run lint:style`              | Stylelint 校验 SCSS                          |
| `pnpm run lint:md`                 | zhlint 校验 Markdown 中文文案                |
| `pnpm run format` / `format:check` | Prettier 格式化 / 校验                       |
| `pnpm run type-check`              | `tsc --noEmit` 类型检查                      |
| `pnpm run test`                    | Vitest 测试                                  |
| `pnpm run test:cov`                | 带覆盖率的测试                               |
| `pnpm run verify`                  | 类型检查 + 全部 lint + 覆盖率测试（CI 同款） |

## 🧪 测试

规则行为由 `eslint/__tests__` 下的 RuleTester 用例保证，请求层与工具由 `src` 下的测试覆盖：

```bash
pnpm run test        # 监听模式
pnpm run test:cov    # 单次运行 + 覆盖率报告
```

## 📄 License

[MIT](./LICENSE) © Lyndon
