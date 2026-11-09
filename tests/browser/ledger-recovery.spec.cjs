const { test, expect, chromium } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Separate persistent profile: Browser.crash kills only this test's browser process.
// The page signals paint explicitly; this test exercises durable accounting, not a physical display.
test('abrupt browser crash recovers reserved and painted rides but retains acknowledged start', async ({ baseURL }) => {
  test.setTimeout(60000);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'zhuyin-crash-test-'));
  const winChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && fs.existsSync(winChrome) ? winChrome : undefined);
  const options = {headless:true, ...(executablePath ? {executablePath} : {})};
  const base = new URL('/', baseURL).href;
  let first = await chromium.launchPersistentContext(profile, options);
  try {
    const page = first.pages()[0] || await first.newPage();
    await page.goto(base);
    await page.waitForFunction(() => !!globalThis.TicketLedger);
    const before = await page.evaluate(async () => {
      const l = await TicketLedger.open(), child = 'crash-test-child';
      for (let n=0; n<3; n++) {
        const mode = 'crash-'+n;
        const round = (await l.getOrCreateRound(child,{mode,questionKey:mode,question:{item:mode},correctId:'a'})).round;
        await l.answer(child,{mode,roundId:round.id,attemptId:crypto.randomUUID(),expectedAttemptCount:0,optionId:'a'});
      }
      for (const op of ['reserved-op','painted-op','started-op']) await l.reserveRide(child,{operationId:op,ride:'carousel',startPolicy:TicketLedger.PAINT_ACK_POLICY});
      await l.markRidePainted(child,'painted-op');
      await l.markRidePainted(child,'started-op');
      await l.startRide(child,'started-op');
      const s = await l.get(child); l.close();
      return {balance:s.balance, statuses:Object.fromEntries(Object.entries(s.rides).map(([key,r]) => [key,r.status]))};
    });
    expect(before).toEqual({balance:0,statuses:{'reserved-op':'reserved','painted-op':'reserved','started-op':'started'}});
    const cdp = await first.newCDPSession(page);
    let crashed = false;
    const closed = new Promise(resolve => first.once('close', () => { crashed = true; resolve(); }));
    await Promise.race([cdp.send('Browser.crash').catch(() => {}), new Promise(resolve => setTimeout(resolve,5000))]);
    await Promise.race([closed, new Promise(resolve => setTimeout(resolve,5000))]);
    expect(crashed, 'Browser.crash must terminate the isolated browser').toBe(true);
    first = null;
    const second = await chromium.launchPersistentContext(profile, options);
    try {
      const restarted = second.pages()[0] || await second.newPage();
      await restarted.goto(base);
      await restarted.waitForFunction(() => !!globalThis.TicketLedger);
      const after = await restarted.evaluate(async () => {
        const old = Date.now; Date.now = () => old() + TicketLedger.RESERVATION_MS + 1000;
        try {
          const l = await TicketLedger.open(), s = await l.get('crash-test-child'); l.close();
          return {balance:s.balance, rides:s.rides, transactions:s.transactions};
        } finally { Date.now = old; }
      });
      expect(after.balance).toBe(2);
      expect(after.rides['reserved-op'].status).toBe('refunded');
      expect(after.rides['painted-op'].status).toBe('refunded');
      expect(after.rides['painted-op'].phase).toBe('painted');
      expect(after.rides['started-op'].status).toBe('started');
      for (const op of ['reserved-op','painted-op']) expect(after.transactions.filter(x => x.type === 'ride_refund' && x.operationId === op)).toHaveLength(1);
    } finally { await second.close(); }
  } finally { await first?.close().catch(() => {}); }
});
