export default [
  {
    // warn 不会让 CI 失败，故提到 error
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/comment-style': 'error',
    },
  },
];
