/** React/JSX/Hooks 规则 */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 走新 JSX 转换，React 无需在作用域中，两条为旧转换服务的规则一并关闭
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      // 确保 JSX 变量被正确识别
      'react/jsx-uses-vars': 'error',
      // 组件名必须使用 PascalCase
      'react/jsx-pascal-case': 'error',
      // 列表渲染禁止使用 index 作为 key
      'react/no-array-index-key': 'error',

      // 确保 Hook 只在函数组件和自定义 Hook 中调用
      'react-hooks/rules-of-hooks': 'error',
      // 强制 effect/记忆化 hook 的依赖完整，杜绝陈旧闭包与漏依赖
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      /*
       * 禁止不必要的箭头函数包裹（如 onClick={() => fn()} 应改为 onClick={fn}）。
       * 不豁免测试：规则只报「纯透传」包裹，测试里同样应直接传函数。
       */
      'custom/no-unnecessary-arrow-wrapper': 'error',
      // Props 接口必须使用「组件名Props」命名格式（测试里的包装组件复用被测 Props 类型，由规则内 isExemptFile 豁免）
      'custom/props-interface-naming': 'error',
    },
  },
];
