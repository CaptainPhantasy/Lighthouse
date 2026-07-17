import path from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest config layers on the existing vite.config.ts aliases so that
 * test imports resolve the same paths as the running app. Adds a
 * zero-dependency browser-global setup so storage/secureScrub/offlineQueue
 * unit tests can run in the node environment without jsdom.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/utils': path.resolve(__dirname, 'lib'),
      '@/components': path.resolve(__dirname, 'components'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup/globals.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e-gemini.test.ts', 'tests/run-e2e-tests.ts', 'node_modules', 'dist'],
  },
});
