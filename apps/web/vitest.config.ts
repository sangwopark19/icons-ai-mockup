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
      include: ['src/components/**/*.{ts,tsx}'],
      exclude: [
        'src/components/**/*.test.{ts,tsx}',
        'src/components/ui/UI_COMPONENTS.md',
        'src/components/providers/**/*',
        'src/components/ui/button.tsx',
        'src/components/ui/checkbox.tsx',
        'src/components/ui/image-uploader.tsx',
        'src/components/ui/input.tsx',
        'src/components/ui/textarea.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
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
