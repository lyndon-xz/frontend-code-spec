export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'custom/no-param-destructuring': 'error',
      'custom/hoist-module-scope-destructuring': 'error',
    },
  },
];
