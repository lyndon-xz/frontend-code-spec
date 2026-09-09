/** commit message 规范，由 .husky/commit-msg 钩子在每次提交时校验。 只收敛「机器判得准」的部分（类型、大小写、长度、空行），描述写什么由 review 把关。 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    /*
     * 收窄 conventional 的默认类型表：按「改了什么性质的东西」分，不按模块分。
     * 模块信息走 scope（如 feat(eslint):），类型只回答「这是新增、修复还是重构」。
     */
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'build',
        'ci',
      ],
    ],
    // 类型统一小写：Feat 与 feat 混用会让按类型过滤历史（git log --grep）漏掉一半
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    // 描述不可为空：只有类型的提交在历史里等于没有信息
    'subject-empty': [2, 'never'],
    /*
     * header 与 body、body 与 footer 之间必须空一行。
     * 这是 git 解析提交信息的依据：不空行，body 会被当成 header 的一部分，
     * `git log --oneline` 里就会拖出一整段正文。
     */
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    /*
     * 放宽到 120（conventional 默认 100）：中文描述的信息密度高于英文，
     * 100 字符常需要把一句完整的话截断。超过 120 的细节应该写进 body 而非 header。
     */
    'header-max-length': [2, 'always', 120],
  },
};
