const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'src/app.js',
  'src/styles.css',
  'manifest.json',
  'service-worker.js',
  'assets/icons/icon.svg',
  'assets/audio/audio-manifest.json',
  '.github/workflows/validate.yml',
  'AGENTS.md',
  'PLAN.md',
  'PROGRESS.md',
  'DECISIONS.md',
  'TASKS.md',
  'README.md'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('manifest display must be standalone');
if (!manifest.icons?.some((icon) => icon.src === 'assets/icons/icon.svg' && icon.type === 'image/svg+xml')) {
  throw new Error('manifest must include existing SVG icon');
}
if (!manifest.start_url) throw new Error('manifest must include start_url');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const snippet of ['rel="manifest"', 'apple-mobile-web-app-capable', 'audioNotice', 'cardsView', 'listenView', 'wordView', 'parentView']) {
  if (!html.includes(snippet)) throw new Error(`index.html missing ${snippet}`);
}

const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
for (const snippet of ['localStorage', 'speechSynthesis', 'new Audio', 'serviceWorker', 'audio-manifest.json', '不代表標準單一注音發音']) {
  if (!app.includes(snippet)) throw new Error(`src/app.js missing ${snippet}`);
}
const symbolBlock = app.match(/const symbols = \[([\s\S]*?)\];/);
if (!symbolBlock) throw new Error('src/app.js missing symbols array');
const symbols = vm.runInNewContext(`[${symbolBlock[1]}]`);
const expectedSymbols = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('');
if (symbols.length !== 37) throw new Error(`expected 37 symbols, found ${symbols.length}`);
for (const expected of expectedSymbols) {
  const item = symbols.find((entry) => entry.symbol === expected);
  if (!item?.word || !item?.emoji || !item?.audioKey) throw new Error(`missing symbol data for ${expected}`);
}

const audioManifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/audio/audio-manifest.json'), 'utf8'));
if (Object.keys(audioManifest.items || {}).length !== 37) throw new Error('audio manifest must include 37 items');
for (const expected of expectedSymbols) {
  if (!audioManifest.items[expected]?.file || !audioManifest.items[expected]?.status) throw new Error(`audio manifest missing ${expected}`);
}

const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
for (const file of ['index.html', 'src/styles.css', 'src/app.js', 'manifest.json', 'audio-manifest.json']) {
  if (!sw.includes(file)) throw new Error(`service-worker.js cache list missing ${file}`);
}
for (const snippet of ['CACHE_VERSION', 'startsWith(\'zhuyin-bee-\')', 'caches.delete']) {
  if (!sw.includes(snippet)) throw new Error(`service-worker.js missing cache cleanup/version check: ${snippet}`);
}

console.log('PWA static validation passed.');
