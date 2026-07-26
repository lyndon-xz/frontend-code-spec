import path from 'path';

import { defineConfig } from 'vitest/config';

/**
 * 两类测试同仓运行：
 * - 规则集 RuleTester 用例（eslint 目录下的 __tests__）。
 * - 请求层范式用例（src 目录下的 __tests__，部分依赖 window，故统一用 jsdom 环境）。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['eslint/__tests__/**/*.test.{ts,js}', 'src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['eslint/**/*.js', 'src/**/*.ts'],
      exclude: ['eslint/__tests__/**', 'src/**/__tests__/**', '**/*.scss'],
      thresholds: {
        statements: 95,
        lines: 95,
        branches: 95,
        functions: 95,
      },
    },
  },
});
