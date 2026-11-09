const { defineConfig } = require('@playwright/test');
const fs = require('node:fs');
const winChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && fs.existsSync(winChrome) ? winChrome : undefined);
const baseURL = 'http://127.0.0.1:' + (process.env.ZHUYIN_TEST_PORT || '4173');
module.exports = defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  expect: { timeout: 7000 },
  workers: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, browserName: 'chromium', launchOptions: executablePath ? { executablePath } : {}, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/serve-local.cjs', url: baseURL + '/', reuseExistingServer: false, timeout: 15000 }
});
