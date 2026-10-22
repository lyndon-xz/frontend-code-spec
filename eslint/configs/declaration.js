export default [
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    rules: {
      // 只放行 `x == null`：匹配 null 与 undefined，无隐式转换陷阱
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      // props: false 只拦重新赋值参数本身，改参数对象的属性不在此列
      'no-param-reassign': ['error', { props: false }],
      'max-params': ['error', 3],
    },
  },
  {
    // ts/tsx 由 typescript 组的 @typescript-eslint/no-shadow 负责，核心版不认类型与值同名
    files: ['**/*.js'],
    rules: {
      'no-shadow': 'error',
    },
  },
];
