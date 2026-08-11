export default [
  {
    // 默认只报 warn，而 warn 不会让 CI 失败，失效的豁免会一直挂着，故提到 error
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      'custom/comment-style': 'error',
    },
  },
];
