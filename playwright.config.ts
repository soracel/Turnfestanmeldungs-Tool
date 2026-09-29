import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173/turnfest/', headless: true },
  webServer: {
    command:
      'BASE_PATH=/turnfest/ pnpm build && BASE_PATH=/turnfest/ pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/turnfest/',
    reuseExistingServer: false,
  },
});
