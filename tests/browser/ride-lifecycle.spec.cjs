const {test, expect} = require('@playwright/test');

async function setUpRide(page) {
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  await page.locator('#islandView [data-go="listenView"]').click();
  await expect(page.locator('#listenChoices [data-answer]')).toHaveCount(4);
  const answer = await page.evaluate(async () => {
    const ledger = await TicketLedger.open();
    try {
      const current = await ledger.get('child-1');
      return current.rounds[current.activeRounds.listen].correctId;
    } finally { ledger.close(); }
  });
  await page.locator(`#listenChoices [data-answer="${answer}"]`).click();
  await expect(page.locator('#listenFeedback')).toContainText('獲得 1 張');
  await page.locator('#islandHome').click();
  await page.locator('#islandView [data-go="ridesView"]').first().click();
  await page.locator('[data-ride="carousel"]').click();
  await page.locator('[data-ride-action="confirm"]').click();
}

test('invisible first motion refunds the reserved ticket without acknowledging a start', async ({page}) => {
  await setUpRide(page);
  await page.addStyleTag({content:'#ridesView .ride-stage {display:none !important}'});
  await page.locator('[data-ride-action="start"]').click();
  await expect(page.locator('.ride-status')).toContainText('無法開始搭乘');
  const result = await page.evaluate(async () => {
    const ledger = await TicketLedger.open();
    try {
      const current = await ledger.get('child-1');
      return {balance:current.balance, rides:Object.values(current.rides), types:current.transactions.map((entry)=>entry.type)};
    } finally { ledger.close(); }
  });
  expect(result.balance).toBe(1);
  expect(result.rides).toHaveLength(1);
  expect(result.rides[0].status).toBe('refunded');
  expect(result.types.filter((kind)=>kind.startsWith('ride_'))).toEqual(['ride_debit','ride_refund']);
});

test('hidden ride pauses animation and closes its audio context', async ({page}) => {
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext || window.webkitAudioContext;
    if (!NativeContext) return;
    window.testRideAudio = { opened:0, closed:0 };
    window.AudioContext = class extends NativeContext {
      constructor() { super(); window.testRideAudio.opened += 1; }
      close() { window.testRideAudio.closed += 1; return super.close(); }
    };
  });
  await setUpRide(page);
  await page.locator('[data-ride-action="start"]').click();
  await expect(page.locator('[data-ride-action="pause"]')).toBeVisible();
  expect(await page.evaluate(()=>window.testRideAudio.opened)).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('[data-ride-action="pause"]')).toHaveText('繼續');
  const transform = await page.locator('.ride-vehicle').getAttribute('style');
  await page.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await page.locator('.ride-vehicle').getAttribute('style')).toBe(transform);
  const audio = await page.evaluate(()=>window.testRideAudio);
  expect(audio.closed).toBe(audio.opened);
});
