/** React/JSX/Hooks 规则 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 走新 JSX 转换，React 无需在作用域中，两条为旧转换服务的规则一并关闭
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-array-index-key': 'error',

      'react-hooks/rules-of-hooks': 'error',
      // 依赖不全会留下陈旧闭包
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      /*
       * 禁止不必要的箭头函数包裹（onClick={() => fn()} 应改为 onClick={fn}）。
       * 不豁免测试：规则只报「纯透传」包裹，测试里同样应直接传函数。
       */
      'custom/no-unnecessary-arrow-wrapper': 'error',
      // Props 接口须命名为「组件名Props」（测试里复用被测 Props 类型的包装组件由规则内 isExemptFile 豁免）
      'custom/props-interface-naming': 'error',
    },
  },
];
