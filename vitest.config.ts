import path from 'node:path';

import { defineConfig } from 'vitest/config';

const alias = {
  '@': path.resolve(__dirname, './src'),
};

/**
 * eslint-rules 用 node（纯静态分析，省掉 jsdom 开销）；request-layer 依赖 window，须 jsdom。
 * coverage 只在根级生效，project 级会被忽略。
 */
export default defineConfig({
  test: {
    coverage: {
      // 用 istanbul 插桩。v8 会把 ESLint 原生加载的规则和测试里的导入收成两份，合并时把已覆盖的函数计成 0。
      provider: 'istanbul',
      include: ['eslint/**/*.js', 'src/**/*.{ts,tsx}'],
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
