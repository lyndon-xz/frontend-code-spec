# AGENTS.md

本文件是各 agent 工具读取本仓库约定的人读入口。

## 标准仓契约

[`standard.manifest.json`](./standard.manifest.json) 是机器可读入口：声明适用文件、覆盖维度、规则清单，以及审查别的仓库时可执行的只读命令。本文件与它互为对照，改一处必须同步另一处。

审查时 `checks[].command` 里的 `<files>` 由审查 skill 替换为待审文件列表，`<target>` 替换为目标仓库根目录，`<standard>` 替换为本仓库根目录；`reviewDefault` 为 `false` 的 check 不参与审查。

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

- 改自研 ESLint 规则的条目时，同步改 README 的规则表与 `standard.manifest.json` 的 `rules`。改 `.agents/rules/` 的 description、适用文件或顺序时，同步改下面的索引与 manifest。对账测试会挡住前两处不一致。
- 规则 ID 不改名；删除的 ID 不再复用。

## 禁止事项

- 提交与推送不带 `--no-verify`，钩子失败就修根因。
- 不手改生成产物：`pnpm-lock.yaml` 只由 pnpm 生成，`coverage/`、`dist/` 是构建输出。

## 覆盖率

以 `pnpm test:cov` 的门禁为准，阈值只在 `vitest.config.ts` 里维护。

## 版本与废弃

- 语义化版本；规则语义收紧、删除规则算 breaking。
- `custom/*` 规则名不改、删除后不复用；废弃先标 `deprecated` 一个版本，下一版再删。
- 业务仓按 git tag 安装，本仓不往 npm registry 发布。
- 合并到 main 后按 `package.json` 的版本打 tag；tag 是业务仓安装的依据，未打 tag 的版本视为未发布。

## 开发规则

适用文件为通用的几份全部要读，再按正在编辑的文件读对应行。这些规则只指引怎么写。工具能判定的以 `pnpm verify` 的报错为准。`src/` 是照这些约定写的范式样板，主体是请求层。

| 规则文件                                     | 适用文件                | 管什么                                                             |
| -------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| [structure.md](.agents/rules/structure.md)   | 通用                    | 决定同一份值放在哪、谁可以依赖谁、一个模块对外承诺什么             |
| [functions.md](.agents/rules/functions.md)   | 通用                    | 规定一个函数用一句话能说完，并且只做编排或只做细节                 |
| [naming.md](.agents/rules/naming.md)         | 通用                    | 规定什么时候抽名字，以及名字是否说准                               |
| [comments.md](.agents/rules/comments.md)     | 通用                    | 规定注释只补代码表达不出的原因与前提，只写当前状态，不写历史与出处 |
| [writes.md](.agents/rules/writes.md)         | 通用                    | 规定批量写入按项给出结果，重跑会多出数据的写操作要锁住或带幂等标识 |
| [typescript.md](.agents/rules/typescript.md) | `**/*.ts`、`**/*.tsx`   | 规定类型贴着业务对象，取值只有一个源，外部值在入口收窄             |
| [react.md](.agents/rules/react.md)           | `**/*.jsx`、`**/*.tsx`  | 规定组件何时拆开，以及互斥分支怎么返回                             |
| [style.md](.agents/rules/style.md)           | `**/*.scss`、`**/*.css` | 规定悬停、聚焦和按下用伪类，组件自己的样式块顺序对齐标记           |
