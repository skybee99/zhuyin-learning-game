const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const requiredFiles = [
  'public/index.html',
  'public/src/app.js',
  'public/src/styles.css',
  'public/manifest.json',
  'public/service-worker.js',
  'public/assets/icons/icon.svg',
  'public/assets/audio/audio-manifest.json',
  'public/.assetsignore',
  '.github/workflows/validate.yml',
  'wrangler.jsonc',
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

for (const internal of ['AGENTS.md', 'PLAN.md', 'PROGRESS.md', 'DECISIONS.md', 'TASKS.md', 'MEMORY.md', 'ARCHITECTURE.md', 'CHANGELOG.md', 'README.md']) {
  if (fs.existsSync(path.join(publicRoot, internal))) throw new Error(`Internal document must not be public: ${internal}`);
}
for (const internalDir of ['.git', '.wrangler', 'tests', 'reports', '.github', 'node_modules']) {
  if (fs.existsSync(path.join(publicRoot, internalDir))) throw new Error(`Internal directory must not be public: ${internalDir}`);
}

const wrangler = fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8');
if (!wrangler.includes('"directory": "./public"')) throw new Error('wrangler assets directory must be ./public');
if (wrangler.includes('nodejs_compat') || wrangler.includes('compatibility_flags')) throw new Error('pure static Worker must not enable nodejs_compat');

const manifest = JSON.parse(fs.readFileSync(path.join(publicRoot, 'manifest.json'), 'utf8'));
if (manifest.display !== 'standalone') throw new Error('manifest display must be standalone');
if (manifest.start_url !== './index.html') throw new Error('manifest start_url must resolve from deployment root');
if (manifest.scope !== './') throw new Error('manifest scope must resolve from deployment root');
if (!manifest.icons?.some((icon) => icon.src === 'assets/icons/icon.svg' && icon.type === 'image/svg+xml')) {
  throw new Error('manifest must include existing SVG icon without /public/ prefix');
}

const html = fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8');
for (const snippet of [
  'rel="manifest" href="manifest.json"',
  'rel="apple-touch-icon" href="assets/icons/icon.svg"',
  'rel="stylesheet" href="src/styles.css"',
  'src="src/app.js"',
  'apple-mobile-web-app-capable',
  'audioNotice',
  'cardsView',
  'listenView',
  'wordView',
  'spellView',
  'parentView'
]) {
  if (!html.includes(snippet)) throw new Error(`index.html missing ${snippet}`);
}
if (html.includes('/public/') || html.includes('public/')) throw new Error('index.html must not expose public/ in URLs');

const app = fs.readFileSync(path.join(publicRoot, 'src/app.js'), 'utf8');
for (const snippet of ['localStorage', 'speechSynthesis', 'new Audio', 'serviceWorker', 'assets/audio/audio-manifest.json', 'service-worker.js', 'APP_VERSION', 'spellingQuestions', 'zhuyinDisplay']) {
  if (!app.includes(snippet)) throw new Error(`public/src/app.js missing ${snippet}`);
}
const expectedSymbols = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split('');
for (const expected of expectedSymbols) {
  if (!app.includes(`symbol: '${expected}'`) && !app.includes(`'${expected}':`)) throw new Error(`missing symbol data for ${expected}`);
}
if (!app.includes('const symbols = expectedSymbols.map')) throw new Error('public/src/app.js must build complete symbols array');
for (const field of ['group', 'sampleWord', 'sampleZhuyin', 'emoji', 'audio']) {
  if (!app.includes(field)) throw new Error(`symbol data missing field ${field}`);
}
if (!app.includes('class=\"symbol zhuyin-symbol\"') || !app.includes('class=\"zhuyin-symbol\"')) {
  throw new Error('zhuyin display must use .zhuyin-symbol');
}
if (!html.includes('<ruby>') || !html.includes('<rt>') || !app.includes('<ruby')) throw new Error('ruby/rt zhuyin annotations are required');
if (!app.includes('ㄓㄜ')) throw new Error('manual polyphone data for 跟著念 must use contextual zhuyin');

const audioManifest = JSON.parse(fs.readFileSync(path.join(publicRoot, 'assets/audio/audio-manifest.json'), 'utf8'));
if (audioManifest.basePath !== 'assets/audio/') throw new Error('audio manifest basePath must resolve from deployment root');
if (Object.keys(audioManifest.items || {}).length !== 37) throw new Error('audio manifest must include 37 items');
for (const expected of expectedSymbols) {
  if (!audioManifest.items[expected]?.file || !audioManifest.items[expected]?.status) throw new Error(`audio manifest missing ${expected}`);
}

const sw = fs.readFileSync(path.join(publicRoot, 'service-worker.js'), 'utf8');
for (const file of ['./', './index.html', './src/styles.css', './src/app.js', './manifest.json', './assets/audio/audio-manifest.json', './assets/icons/icon.svg']) {
  if (!sw.includes(file)) throw new Error(`service-worker.js cache list missing ${file}`);
}
for (const snippet of ["zhuyin-bee-v1-1-0", "startsWith('zhuyin-bee-')", 'caches.delete']) {
  if (!sw.includes(snippet)) throw new Error(`service-worker.js missing cache cleanup/version check: ${snippet}`);
}
if (sw.includes('/public/') || sw.includes('public/')) throw new Error('service-worker.js must not expose public/ in cached URLs');
if (!sw.includes('zhuyin-bee-v1-1-0')) throw new Error('service-worker.js cache version must be v1-1-0');

const assetsIgnore = fs.readFileSync(path.join(publicRoot, '.assetsignore'), 'utf8');
for (const pattern of ['.git', '.wrangler', '*.md', 'tests', 'reports', '.github', 'node_modules', 'wrangler.jsonc']) {
  if (!assetsIgnore.includes(pattern)) throw new Error(`public/.assetsignore missing ${pattern}`);
}

console.log('PWA static validation passed.');
