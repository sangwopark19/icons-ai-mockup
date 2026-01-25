import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/generation-options.tsx',
        'src/app/projects/[id]/ip-change/page.tsx',
        'src/app/projects/[id]/generations/[genId]/page.tsx',
        'src/app/projects/[id]/style-copy/page.tsx',
        'src/lib/cn.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@icons/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
