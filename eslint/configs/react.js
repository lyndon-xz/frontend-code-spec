export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 走新 JSX 转换，不需要 import React
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-array-index-key': 'error',

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
