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
      // 只放行 `x == null`：它只匹配 null 与 undefined，没有隐式转换陷阱
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    // 控制台输出单独一个 scope：测试里 console 是 spy 断言对象，而第三方规则无法内部调用 isExemptFile，故从同一来源取 glob
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: EXEMPT_GLOBS,
    rules: {
      // warn / error 是有意的告警通道，放行；log / info / group 只在排查现场有意义，留下会把内部数据打给用户看
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
