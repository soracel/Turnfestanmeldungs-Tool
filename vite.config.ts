import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.BASE_PATH || './',
  plugins: [react()],
  publicDir: false,
  server: {
    fs: { deny: ['**/*.csv', '**/*.pdf', '**/private-data/**', '**/.git/**', '**/.env*'] },
  },
});
