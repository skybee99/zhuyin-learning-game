const {test,expect} = require('@playwright/test');
// The upgrade fixture derives legacy storage keys from Git history; keep them out of public trace artifacts.
test.use({trace:'off',screenshot:'off'});
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const BASE = '8f4f1fa7feeed11515116bd2251691faf10f0a82';
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const old = (relative, base = BASE) => execFileSync('git',['show',`${base}:public/${relative}`],{cwd:root,stdio:['ignore','pipe','ignore']});


async function switchableOrigin(base, requests = []) {
  let upgraded = false;
  const oldAssets = new Map();
  const server = http.createServer((req,res) => {
    const name = new URL(req.url,'http://127.0.0.1').pathname.slice(1) || 'index.html';
    requests.push(name);
    if (name === '__test_seed.html') {
      return res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end('<title>Isolated upgrade fixture</title>');
    }
    if (name.includes('..')) return res.writeHead(403).end();
    try {
      let bytes;
      if (upgraded) bytes = fs.readFileSync(path.join(root,'public',name));
      else {
        if (!oldAssets.has(name)) oldAssets.set(name,old(name,base));
        bytes = oldAssets.get(name);
      }
      res.writeHead(200,{'Content-Type':mime[path.extname(name)] ?? 'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  return {
    origin:`http://127.0.0.1:${server.address().port}`,
    upgrade() { upgraded = true; },
    async close() {
      server.closeAllConnections();
      await new Promise((resolve)=>server.close(resolve));
    }
  };
}

test('actual baseline service worker to V2, preserve three synthetic roles, then restart offline',async ({page,context}) => {
  const legacySource = old('src/app.js').toString();
  const ids = [...legacySource.matchAll(/\{ id: '([^']+)', chineseName:/g)].map((m)=>m[1]);
  expect(ids.length).toBe(3);
  const seed = ids.map((id,i)=>({key:`zhuyin-profile-${id}`,value:JSON.stringify({
    schemaVersion:3,stars:[7,11,17][i],answers:[9,14,22][i],difficulty:'advanced',heardZhuyin:['ㄣ'],learnedZhuyin:['ㄢ'],
    settings:{soundOn:false,volume:0.3,textSize:'large'},extraPreserved:'synthetic'
  })}));
  const legacyDict = JSON.stringify({characters:[{id:'synthetic-character',han:'土',zhuyin:['ㄊ','ㄨ','ˇ']}],words:[],changeLogs:[]});
  const requests = [];
  const errors = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('ServiceWorker.workerErrorReported',({error})=>errors.push(error.errorMessage));
  await cdp.send('ServiceWorker.enable');
  const site = await switchableOrigin(BASE, requests);
  const {origin} = site;
  try {
    await page.goto(`${origin}/__test_seed.html`);
    await page.evaluate(async ({seed,legacyDict,id})=>{
      for (const row of seed) localStorage.setItem(row.key,row.value);
      localStorage.setItem('zhuyin-local-dictionary',legacyDict);
      localStorage.setItem('zhuyin-current-child',id);
      await caches.open('unrelated-app-test');
      await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;
    },{seed,legacyDict,id:ids[1]});
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    expect(await page.evaluate(()=>caches.keys())).toContain('zhuyin-zoo-v1-3-2');
    site.upgrade();
    await page.goto(origin);
    await expect(page.locator('#starsCount')).toHaveText('11');
    await expect(page.locator('body')).toHaveAttribute('data-text-size','large');

    try { await expect(page.locator('#updateNow')).toBeVisible({timeout:18000}); }
    catch (e) { throw new Error(JSON.stringify({requests,errors,appStatus:await page.locator('#appStatus').textContent(),cacheNames:await page.evaluate(()=>caches.keys())}),{cause:e}); }
    await Promise.all([page.waitForEvent('framenavigated',{predicate:(f)=>f===page.mainFrame()}),page.locator('#updateNow').click()]);
    await page.waitForLoadState('domcontentloaded');
    await expect.poll(()=>page.evaluate(async()=>(await caches.keys()).filter((k)=>k.startsWith('zhuyin-')))).toEqual(['zhuyin-island-v2-0-0-explore-1']);
    expect(await page.evaluate(()=>caches.keys())).toContain('unrelated-app-test');
    await expect(page.locator('#starsCount')).toHaveText('11');
    await page.locator('#switchChild').click();
    await page.locator('[data-child="child-1"]').click();
    await expect(page.locator('#starsCount')).toHaveText('7');
    await page.locator('#switchChild').click();
    await page.locator('[data-child="child-3"]').click();
    await expect(page.locator('#starsCount')).toHaveText('17');
    await page.locator('#islandView [data-go="wordView"]').first().click();
    await expect(page.locator('#wordChoices button')).toHaveCount(4);
    const before = await page.evaluate(async () => {
      const ledger = await TicketLedger.open();
      try {
        const state = await ledger.get('child-3');
        const key = state.activeRounds.word;
        return { key,correctId:state.rounds[key].correctId };
      } finally { ledger.close(); }
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('目前離線，仍可練習和遊玩。', {exact:false})).toBeVisible();
    await page.locator('#islandView [data-go="wordView"]').first().click();
    await page.locator(`#wordChoices [data-word="${before.correctId}"]`).click();
    await expect(page.locator('#wordFeedback')).toContainText('獲得 1 張');
    await expect(page.locator('#starsCount')).toHaveText('18');
    await page.reload();
    await expect(page.locator('#starsCount')).toHaveText('18');
    await page.locator('#islandView [data-go="wordView"]').first().click();
    await expect(page.locator('#nextWord')).toBeVisible();
    const after = await page.evaluate(async () => {
      const ledger = await TicketLedger.open();
      try {
        const s = await ledger.get('child-3');
        const cache = await caches.open('zhuyin-island-v2-0-0-explore-1');
        return { key:s.activeRounds.word,balance:s.balance,paths:(await cache.keys()).map((r)=>new URL(r.url).pathname) };
      } finally { ledger.close(); }
    });
    expect(after.key).toBe(before.key);
    expect(after.balance).toBe(1);
    expect(after.paths).toContain('/offline.html');
    expect(after.paths).not.toContain('/');
    expect(after.paths).not.toContain('/index.html');
    const unchanged = await page.evaluate(({seed,legacyDict}) => seed.every(({key,value})=>localStorage.getItem(key)===value)
      && localStorage.getItem('zhuyin-local-dictionary')===legacyDict,{seed,legacyDict});
    expect(unchanged).toBe(true);
    await context.setOffline(false);
    await page.reload();
    await expect(page.locator('.offline-status')).toHaveCount(0);
    await expect(page.locator('#starsCount')).toHaveText('18');
  } finally {
    await context.setOffline(false);
    await site.close();
  }
});

test('parent gate and explicit backup import preserve other roles and keep a verified PRE',async ({page})=>{
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  await page.locator('#islandView [data-go="parentView"]').first().click();
  await expect(page.locator('#parentGate')).toBeVisible();
  await expect(page.locator('#parentBox')).not.toBeVisible();
  await page.locator('#unlockParent').click();
  await expect(page.locator('#parentBox')).toBeVisible();
  const backup = {app:'zhuyin-island',version:'V2.0.0',progress:[{childId:'child-1',stars:5,answers:7,correct:5,wrong:2,
    settings:{displayName:'測試島友',soundOn:false},heardZhuyin:['ㄢ']}],dictionary:{local:{characters:[{id:'synthetic-entry',han:'橋',zhuyin:['ㄑ','ㄧ','ㄠ','ˊ']}]}}};
  await page.locator('#backupImportFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.locator('#previewBackupImport').click();
  await expect(page.locator('#backupImportPreview')).toContainText('0 → 5');
  await expect(page.locator('#starsCount')).toHaveText('0');
  page.once('dialog',(d)=>d.accept());
  await page.locator('#applyBackupImport').click();
  await expect(page.locator('#appStatus')).toContainText('PRE SHA-256');
  await expect(page.locator('#childBadge')).toContainText('測試島友');
  await expect(page.locator('#starsCount')).toHaveText('5');
  await expect(page.locator('#dictionaryResults')).toContainText('橋');
  const pre = await page.evaluate(()=>Object.keys(localStorage).find((key)=>key.startsWith('zhuyin-island-pre-')));
  expect(pre).toBeTruthy();
  const match = await page.evaluate(async (key)=>{
    const raw = localStorage.getItem(key);
    return { hash:await IslandStorage.sha256(raw),preRevision:JSON.parse(raw).exactLocalState.revision };
  },pre);
  expect(match.preRevision).toBe(0);
  await expect(page.locator('#appStatus')).toContainText(match.hash);
  await page.locator('#switchChild').click();
  await page.locator('[data-child="child-2"]').click();
  await expect(page.locator('#starsCount')).toHaveText('0');
});

test('the original V2.0.0 cache upgrades to exploration and preserves a completed round', async ({page,context}) => {
  const site = await switchableOrigin('c966822ce86fc96c6503d12999cd75b77a45fcee');
  const snapshot = () => page.evaluate(async () => {
    const ledger = await TicketLedger.open();
    try {
      const record = await ledger.get('child-1');
      const id = record.activeRounds.listen;
      return {id,balance:record.balance,correctId:record.rounds[id]?.correctId,stars:record.stars};
    } finally { ledger.close(); }
  });
  try {
    await page.goto(site.origin);
    await page.locator('[data-child="child-1"]').click();
    await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
    expect(await page.evaluate(()=>caches.keys())).toContain('zhuyin-island-v2-0-0');
    await page.locator('#islandView [data-go="listenView"]').click();
    await expect(page.locator('#listenChoices [data-answer]')).toHaveCount(4);
    const pending = await snapshot();
    await page.locator(`#listenChoices [data-answer="${pending.correctId}"]`).click();
    await expect(page.locator('#listenFeedback')).toContainText('獲得 1 張');
    const before = await snapshot();
    expect(before.balance).toBe(1);
    site.upgrade();
    await page.goto(site.origin);
    await expect(page.locator('.explore-player')).toBeVisible();
    await expect(page.locator('#updateNow')).toBeVisible({timeout:18000});
    await Promise.all([page.waitForEvent('framenavigated',{predicate:(f)=>f===page.mainFrame()}),page.locator('#updateNow').click()]);
    await expect(page.locator('.explore-player')).toBeVisible();
    expect(await snapshot()).toEqual(before);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.offline-status')).toBeVisible();
    await expect(page.locator('.explore-player')).toBeVisible();
    expect(await snapshot()).toEqual(before);
  } finally {
    await context.setOffline(false);
    await site.close();
  }
});
