// Keep online and offline HTML shells identical. Only the fallback's status banner differs.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', 'public');
require('../public/src/version.js');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const index = html.replace(/((?:src|href)="src\/[^"?]+)(?:\?v=[^"]*)?"/g, '$1?v=' + globalThis.ZHUYIN_RELEASE.version + '"');
if (process.argv.includes('--check')) {
  if (index !== html) throw new Error('HTML resource release tags are out of date');
} else if (index !== html) {
  fs.writeFileSync(path.join(root, 'index.html'), index);
}
const marker = '<!-- offline status -->';
if (index.split(marker).length !== 2) throw new Error('Missing offline status marker');
const offline = index.replace(marker, '<p class="offline-status" role="status">目前離線，仍可練習和遊玩。紀錄儲存在這台裝置。</p>');
const target = path.join(root, 'offline.html');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== offline) throw new Error('Offline shell differs; run node scripts/rebuild-shell.cjs');
} else {
  fs.writeFileSync(target, offline);
}
