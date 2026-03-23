import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      // Client tests use happy-dom (avoids CSS ESM issues with jsdom 27)
      ['client/__tests__/**', 'happy-dom'],
    ],
    include: [
      'core/__tests__/**/*.test.ts',
      'client/__tests__/**/*.test.{ts,tsx}',
      'server/__tests__/**/*.test.ts',
    ],
    setupFiles: ['client/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      // Only report coverage for files that have tests written for them.
      // App.tsx, main.tsx, Editor, History, and Preview components are
      // scheduled for coverage in later sprints once the backend is connected.
      include: [
        'core/**/*.ts',
        'client/hooks/useSSE.ts',
        'client/hooks/useTestRun.ts',
        'client/components/Results/ResultsPanel.tsx',
        'client/components/Results/SummaryBar.tsx',
        'client/components/Results/TestResultCard.tsx',
        'client/components/Toolbar/Toolbar.tsx',
        'client/components/Toolbar/SaveLoadDialog.tsx',
        'server/middleware/sse.ts',
        'server/routes/run.ts',
        'server/routes/suites.ts',
        'server/routes/history.ts',
        'client/services/api.ts',
      ],
      exclude: [
        'core/__tests__/**',
        'core/types.ts',
        'core/playwright-runner.ts',
        'client/__tests__/**',
        'client/**/*.d.ts',
        'server/__tests__/**',
        'server/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
