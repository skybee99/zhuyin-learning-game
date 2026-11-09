'use strict';
// Runs the browser test against real IndexedDB without third-party test dependencies.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function main() {
  const candidates = [process.env.CHROME_PATH, process.platform === 'win32' && 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  const chrome = candidates.find(x => fs.existsSync(x));
  if (!chrome) throw new Error('Chrome/Chromium not found. Set CHROME_PATH.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'zhuyin-ledger-test-'));
  const browser = spawn(chrome, ['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,pathToFileURL(path.join(__dirname,'test-ticket-ledger.html')).href], {stdio:'ignore'});
  try {
    const deadline = Date.now() + 30000;
    const portFile = path.join(profile, 'DevToolsActivePort');
    while (!fs.existsSync(portFile) && Date.now() < deadline) await pause(100);
    if (!fs.existsSync(portFile)) throw new Error('Chrome debugging endpoint unavailable');
    const port = fs.readFileSync(portFile,'utf8').split(/\r?\n/)[0];
    let page;
    while (!page && Date.now() < deadline) {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      page = pages.find(x => x.type === 'page' && x.url.includes('test-ticket-ledger.html'));
      if (!page) await pause(100);
    }
    if (!page) throw new Error('Test page unavailable');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve,reject) => { ws.onopen=resolve; ws.onerror=reject; });
    let seq=0; const pending = new Map();
    ws.onmessage = event => { const m=JSON.parse(event.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    const evaluate = expression => new Promise(resolve => { const id=++seq; pending.set(id,resolve); ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true}})); });
    let result = '';
    while (Date.now() < deadline) {
      const r = await evaluate("document.getElementById('results')?.textContent || ''");
      result = r.result?.result?.value || '';
      if (/^(PASS|FAIL)/.test(result)) break;
      await pause(100);
    }
    ws.close(); console.log(result);
    if (!result.startsWith('PASS ')) throw new Error('Browser test did not pass');
  } finally { browser.kill(); }
}
main().catch(e => { console.error(e.stack || e); process.exitCode=1; });
