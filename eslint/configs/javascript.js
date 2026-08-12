import { EXEMPT_GLOBS } from '../utils/is-exempt-file.js';

export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      'no-nested-ternary': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-else-return': ['error', { allowElseIf: false }],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      // 只放行 `x == null`：匹配 null 与 undefined，无隐式转换陷阱
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    // 测试里 console 是 spy 断言对象，从豁免列表取 glob 排除
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      // warn / error 是有意的告警通道，放行
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
