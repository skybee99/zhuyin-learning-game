const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'src/app.js',
  'src/styles.css',
  'manifest.json',
  'service-worker.js',
  'assets/icons/icon.svg',
  'AGENTS.md',
  'PLAN.md',
  'PROGRESS.md',
  'DECISIONS.md',
  'TASKS.md',
  'README.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('manifest display must be standalone');
if (!manifest.icons?.length) throw new Error('manifest must include icons');
if (!manifest.start_url) throw new Error('manifest must include start_url');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const snippet of ['rel="manifest"', 'apple-mobile-web-app-capable', 'cardsView', 'listenView', 'wordView', 'parentView']) {
  if (!html.includes(snippet)) throw new Error(`index.html missing ${snippet}`);
}

const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
for (const snippet of ['localStorage', 'speechSynthesis', 'new Audio', 'serviceWorker', 'assets/audio/']) {
  if (!app.includes(snippet)) throw new Error(`src/app.js missing ${snippet}`);
}

const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
for (const file of ['index.html', 'src/styles.css', 'src/app.js', 'manifest.json']) {
  if (!sw.includes(file)) throw new Error(`service-worker.js cache list missing ${file}`);
}

console.log('PWA static validation passed.');
