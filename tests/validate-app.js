'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pub = path.join(root, 'public');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const required = [
  'public/index.html','public/offline.html','public/manifest.json','public/service-worker.js',
  'public/src/app.js','public/src/version.js','public/src/storage.js','public/src/ticket-ledger.js','public/src/island.js','public/src/island.css','public/src/curriculum.js','public/src/styles.css',
  'public/assets/icons/icon.svg','public/assets/icons/icon-192.png','public/assets/icons/icon-512.png','public/assets/audio/audio-manifest.json',
  'public/data/zhuyin.json','public/data/characters.json','public/data/words.json','public/data/categories.json','public/data/media-map.json','public/data/questions.json',
  'wrangler.jsonc','src/worker.js','migrations/0001_dictionary.sql','scripts/rebuild-shell.cjs'
];
required.forEach(file => assert(fs.existsSync(path.join(root, file)), `Missing ${file}`));
for (const internal of ['AGENTS.md','PLAN.md','PROGRESS.md','DECISIONS.md','TASKS.md','MEMORY.md','ARCHITECTURE.md','CHANGELOG.md','README.md']) assert(!fs.existsSync(path.join(pub, internal)), `Internal file exposed: ${internal}`);
const wrangler = read('wrangler.jsonc');
for (const value of ['"directory": "./public"','"main": "src/worker.js"','"binding": "ASSETS"']) assert(wrangler.includes(value), `Wrangler missing ${value}`);
assert(!wrangler.includes('"d1_databases"') && !wrangler.includes('replace-with-cloudflare-d1-database-id'), 'Unverified D1 binding');
const manifest = JSON.parse(read('public/manifest.json'));
assert(manifest.display === 'standalone' && manifest.scope === '/', 'Manifest display or scope invalid');
for (const size of ['192x192','512x512']) assert(manifest.icons.some(i => i.sizes === size && fs.existsSync(path.join(pub, i.src.replace(/^\//,'')))), `Manifest missing ${size} icon`);
const html = read('public/index.html').replace(/\?v=V[0-9.]+(?:-explore\.[0-9]+)?/g, '');
for (const id of ['profileView','cardsView','learnView','listenView','wordView','spellView','parentView','islandView','ridesView','collectionView','curriculumView']) assert(html.includes(`id="${id}"`), `Missing ${id}`);
const scriptOrder = ['version','storage','ticket-ledger','island-world','island-explore','island','curriculum','app'];
let position = -1;
for (const name of scriptOrder) {
  const regex = new RegExp(`<script\\s+src="src/${name}\\.js"\\s+defer></script>`);
  const match = regex.exec(html);
  assert(match && match.index > position, `Missing or out-of-order deferred script: ${name}`); position = match.index;
}
assert(!html.includes('public/'), 'Public directory exposed in application URL');
const zhuyin = JSON.parse(read('public/data/zhuyin.json'));
const expected = [...'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'];
assert(zhuyin.length === 37 && new Set(zhuyin.map(z => z.symbol)).size === 37 && expected.every(s => zhuyin.some(z => z.symbol === s)), '37 distinct Zhuyin symbols required');
const categories = JSON.parse(read('public/data/categories.json'));
const chars = JSON.parse(read('public/data/characters.json'));
const words = JSON.parse(read('public/data/words.json'));
assert(categories.length === 17 && chars.length >= 12 && words.length >= 12, 'Audited dictionary data unexpectedly small');
const sw = read('public/service-worker.js');
for (const token of ["importScripts('/src/version.js')", 'APP_SHELL', 'canCacheStaticResponse', "request.mode !== 'navigate'", "request.mode === 'navigate'", 'SKIP_WAITING', 'clients.claim', "cache.match('/offline.html')"]) assert(sw.includes(token), `Service worker missing ${token}`);
assert(!/cache\.put\(event\.request/.test(sw), 'Navigation request must not be written to cache');
const sandbox = { ZHUYIN_RELEASE: {assetRevision:'test'}, importScripts() {}, self: { addEventListener() {} }, Set };
vm.createContext(sandbox);
vm.runInContext(sw + '\nthis.testShell = APP_SHELL;', sandbox);
assert(sandbox.testShell.includes('/offline.html') && !sandbox.testShell.includes('/') && !sandbox.testShell.includes('/index.html'), 'Invalid offline shell allowlist');
for (const asset of sandbox.testShell) assert(asset.startsWith('/') && fs.existsSync(path.join(pub, asset.slice(1))), `Offline asset missing: ${asset}`);
for (const name of scriptOrder) assert(sandbox.testShell.includes(`/src/${name}.js`), `Offline script missing ${name}`);
for (const link of html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)) assert(sandbox.testShell.includes('/' + link[1].replace(/^\//, '')), `Offline stylesheet missing ${link[1]}`);
console.log(`PWA static validation passed. zhuyin=${zhuyin.length}, characters=${chars.length}, words=${words.length}, categories=${categories.length}, offlineAssets=${sandbox.testShell.length}`);
