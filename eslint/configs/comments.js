/** 注释 — 注释风格按导出语义强制，工具指令注释失效即报错（所有文件） */
export default [
  {
    /*
     * 失效的 eslint-disable 会一直挂在代码里，让读者以为某条规则至今仍需豁免。
     * ESLint 9 默认只报 warn，而 `eslint .` 不带 --max-warnings 0 时 CI 不会因 warn 失败，故提到 error。
     */
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'custom/comment-style': 'error',
    },
  },
];
