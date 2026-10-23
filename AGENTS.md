# AGENTS.md

本文件是各 agent 工具读取本仓库约定的唯一入口。

## 命令

校验与开发命令见 README 的[命令](./README.md#-命令)一节，提交前 `pnpm verify` 必须通过。

## 规则源

| 位置                   | 管什么                                      |
| ---------------------- | ------------------------------------------- |
| `.agents/rules/`       | 工具判定不了、要指引 AI 照着写的约定        |
| `eslint/rules/`        | 自研 ESLint 规则，由 `eslint/index.js` 注册 |
| `.stylelintrc.js`      | SCSS 与 CSS 规范                            |
| `.ls-lint.yml`         | 文件与目录命名                              |
| `commitlint.config.js` | commit message 规范                         |

- 改自研 ESLint 规则的条目时，同步改 README 的规则表。改 `.agents/rules/` 的 description、适用文件或顺序时，同步改下面的索引。对账测试会挡住这两处不一致。
- 规则 ID 不改名；删除的 ID 不再复用。

## 禁止事项

- 提交与推送不带 `--no-verify`，钩子失败就修根因。
- 不手改生成产物：`pnpm-lock.yaml` 只由 pnpm 生成，`coverage/`、`dist/` 是构建输出。

## 覆盖率

以 `pnpm test:cov` 的门禁为准，阈值只在 `vitest.config.ts` 里维护。

## 开发规则

适用文件为通用的几份全部要读，再按正在编辑的文件读对应行。这些规则只指引怎么写。工具能判定的以 `pnpm verify` 的报错为准。`src/` 是照这些约定写的范式样板，主体是请求层。

| 规则文件                                     | 适用文件                                                     | 管什么                                                                     |
| -------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [structure.md](.agents/rules/structure.md)   | 通用                                                         | 决定同一份值放在哪、谁可以依赖谁、一个模块对外承诺什么                     |
| [functions.md](.agents/rules/functions.md)   | 通用                                                         | 规定一个函数用一句话能说完，并且只做编排或只做细节                         |
| [naming.md](.agents/rules/naming.md)         | 通用                                                         | 规定什么时候抽名字，以及名字是否说准                                       |
| [comments.md](.agents/rules/comments.md)     | 通用                                                         | 规定注释只写当前代码的原因、前提和临时绕过，不复述代码，不写历史和无关出处 |
| [secrets.md](.agents/rules/secrets.md)       | 通用                                                         | 规定凭证和个人标识不出现在源码、日志和上报                                 |
| [writes.md](.agents/rules/writes.md)         | 通用                                                         | 规定批量写入按项给出结果，重跑会多出数据的写操作要锁住或带幂等标识         |
| [typescript.md](.agents/rules/typescript.md) | `**/*.ts`、`**/*.tsx`                                        | 规定类型贴着业务对象，取值只有一个源，外部值在入口收窄                     |
| [react.md](.agents/rules/react.md)           | `**/*.jsx`、`**/*.tsx`、`**/use[A-Z]*.js`、`**/use[A-Z]*.ts` | 规定组件何时拆、分支怎么返回，以及 ref、记忆化和容错怎么用                 |
| [style.md](.agents/rules/style.md)           | `**/*.scss`、`**/*.css`                                      | 规定悬停、聚焦和按下用伪类，组件自己的样式块顺序对齐标记                   |
