# AGENTS.md

本文件是各 agent 工具读取本仓库约定的唯一入口。

## 命令

校验与开发命令见 README 的[命令](./README.md#-命令)一节，提交前 `pnpm verify` 必须通过。

## 规则源

| 位置                   | 管什么                                      |
| ---------------------- | ------------------------------------------- |
| `.agents/rules/`       | 开发规则：工具判定不了、需要照着写的约定    |
| `eslint/rules/`        | 自研 ESLint 规则，由 `eslint/index.js` 注册 |
| `.stylelintrc.js`      | SCSS 与 CSS 规范                            |
| `.ls-lint.yml`         | 文件与目录命名                              |
| `commitlint.config.js` | commit message 规范                         |

- 改规则语义时，同步改 README 的规则表与 `.agents/rules/`，对账测试会挡住两处不一致。
- 规则 ID 不改名；删除的 ID 不再复用。

## 禁止事项

- 提交与推送不带 `--no-verify`，钩子失败就修根因。
- 不手改生成产物：`pnpm-lock.yaml` 只由 pnpm 生成，`coverage/`、`dist/` 是构建输出。

## 覆盖率

以 `pnpm test:cov` 的门禁为准，阈值只在 `vitest.config.ts` 里维护。
