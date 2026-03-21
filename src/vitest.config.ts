import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['core/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['core/**/*.ts'],
      exclude: ['core/__tests__/**', 'core/types.ts', 'core/playwright-runner.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
