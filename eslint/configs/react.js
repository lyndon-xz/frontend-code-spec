export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 走新 JSX 转换，React 无需在作用域中
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
      // 不豁免测试：规则只报「纯透传」包裹，测试里同样应直接传函数
      'custom/no-unnecessary-arrow-wrapper': 'error',
      // 测试里复用被测 Props 类型的包装组件由规则内 isExemptFile 豁免
      'custom/props-interface-naming': 'error',
    },
  },
];
