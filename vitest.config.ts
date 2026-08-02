import path from 'path';

import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(__dirname, './src'),
  '~': path.resolve(__dirname, './'),
};

/**
 * 两类测试的运行环境不同，故拆成两个 project：
 * - eslint-rules：RuleTester 纯静态分析，不碰 DOM，用 node 环境省掉 jsdom 的初始化开销。
 * - request-layer：请求层范式部分依赖 window，必须用 jsdom。
 *
 * coverage 只在根级生效（project 级会被忽略），因此阈值与统计范围统一放在这里。
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
