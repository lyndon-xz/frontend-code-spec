import js from '@eslint/js';

import customConfigs from './eslint/index.js';

export default [
  { ignores: ['coverage/**', 'dist/**', 'node_modules/**'] },
  js.configs.recommended,

  ...customConfigs,
];
