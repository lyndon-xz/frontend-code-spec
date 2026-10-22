import js from '@eslint/js';

import customConfigs from './eslint/index.js';

export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**', '.agents/tasks/**', '.worktrees/**'] },
  js.configs.recommended,

  ...customConfigs,
];
