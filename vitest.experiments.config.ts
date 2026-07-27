import { defineConfig } from 'vitest/config';

/** 実験スクリプト用。通常のテスト（npm run check）には含めない */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['experiments/**/*.run.ts'],
    testTimeout: 600_000,
  },
});
