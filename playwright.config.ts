import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end configuration.
 *
 * Expects the API on :5078 and `npm start` on :4200. The dev server proxies /api to
 * the API (proxy.conf.json), so the browser sees one origin and CORS never enters the
 * picture.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
