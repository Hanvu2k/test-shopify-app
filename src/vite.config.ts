import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'client'),
  server: {
    port: 5273,
    proxy: {
      '/api': {
        target: 'http://localhost:3737',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@client': resolve(__dirname, 'client'),
    },
  },
});
