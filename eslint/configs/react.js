export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@eslint-react/no-array-index-key': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'custom/no-unnecessary-arrow-wrapper': 'error',
      'custom/props-interface-naming': 'error',
    },
  },
];
