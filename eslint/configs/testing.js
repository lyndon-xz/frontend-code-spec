/** 测试文件专属规则 */
export default [
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // 测试文件豁免
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // 测试特定 AST 节点限制（不覆盖外界规则）
      'ast/testing': 'error',

      // it() 描述禁止以 should 开头（it 已表期望，直述行为）
      'custom/no-should-prefix': 'error',

      'no-restricted-globals': [
        'error',
        // 禁止使用 test，强制使用 it
        {
          name: 'test',
          message: '使用 it 代替 test，描述直述行为、不加 should 前缀',
        },
        // 测试用例中禁止使用 setTimeout，请使用 fake timers
        {
          name: 'setTimeout',
          message: '禁止在测试中使用 setTimeout，请使用 fake timers（如 vi.useFakeTimers()）',
        },
      ],
    },
  },
];
