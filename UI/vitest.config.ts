import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      pool: 'vmForks',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.stories.tsx',
          'src/stories/**',
          'src/test/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],
        thresholds: {
          // Baseline (2026-03-04): Stmts 82.87 | Branch 79.95 | Funcs 74.08 | Lines 84.66
          // Set ~5% below baseline to allow flexibility while preventing regressions
          statements: 77,
          branches: 74,
          functions: 69,
          lines: 79,
        },
      },
    },
  }),
);
