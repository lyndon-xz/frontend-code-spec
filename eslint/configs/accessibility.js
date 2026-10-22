import jsxA11y from 'eslint-plugin-jsx-a11y-x';

/** jsx-a11y 原版的 peer 不含 ESLint 10，改用它的社区分叉 */
export default [
  {
    ...jsxA11y.configs.recommended,
    files: ['**/*.tsx'],
  },
];
