import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envDir: '../../',
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});

// Vite configuration for React 19 + shadcn/ui
