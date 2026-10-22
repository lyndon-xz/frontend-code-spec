import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';

export default [
  {
    // warn 不会让 CI 失败，故提到 error
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      '@eslint-community/eslint-comments': eslintComments,
    },
    rules: {
      'custom/comment-style': 'error',
      // 豁免必须写 `-- 理由`、点名规则、成对关闭，让每处豁免都说得清为什么、管到哪
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/disable-enable-pair': 'error',
    },
  },
];
