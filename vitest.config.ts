import path from 'path';

import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(__dirname, './src'),
  '~': path.resolve(__dirname, './'),
};

/**
 * eslint-rules 用 node（纯静态分析，省掉 jsdom 开销）；request-layer 依赖 window，须 jsdom。
 * coverage 只在根级生效，project 级会被忽略。
 */
export default defineConfig({
  test: {
    coverage: {
      include: ['eslint/**/*.js', 'src/**/*.ts'],
      exclude: ['eslint/__tests__/**', 'src/**/__tests__/**'],
      thresholds: {
        statements: 95,
        lines: 95,
        branches: 95,
        functions: 95,
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'eslint-rules',
          globals: true,
          environment: 'node',
          include: ['eslint/__tests__/**/*.test.{ts,js}'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'request-layer',
          globals: true,
          environment: 'jsdom',
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
