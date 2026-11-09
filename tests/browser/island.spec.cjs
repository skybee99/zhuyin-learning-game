const { test, expect } = require('@playwright/test');

async function selectChild(page, id = 'child-1') {
  await page.goto('/');
  await page.locator(`[data-child="${id}"]`).click();
  await expect(page.locator('#islandView')).toBeVisible();
}
async function ledger(page, child = 'child-1') {
  return page.evaluate(async childId => (await TicketLedger.open()).get(childId), child);
}
async function earn(page) {
  await page.locator('#islandView [data-go="listenView"]').click();
  await expect(page.locator('#listenChoices [data-answer]').first()).toBeVisible();
  const answer = await page.evaluate(async () => {
    const state = await (await TicketLedger.open()).get('child-1');
    return state.rounds[state.activeRounds.listen].correctId;
  });
  await page.locator('#listenChoices [data-answer]').filter({ hasText: answer }).first().click();
  await expect.poll(async () => (await ledger(page)).balance).toBeGreaterThan(0);
  await page.locator('#islandHome').click();
}
async function setupRide(page, type) {
  await page.locator('#islandView [data-go="ridesView"]').first().click();
  await page.locator(`[data-ride="${type}"]`).click();
  await page.locator('[data-ride-action="confirm"]').click();
  await page.locator('[data-ride-action="start"]').click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (window.speechSynthesis) { window.speechSynthesis.speak = () => {}; } });
});

test('island navigation, empty balance, earn, carousel and isolated decoration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await selectChild(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await setupRide(page, 'carousel');
  await expect(page.locator('.ride-status')).toContainText('無法開始');
  expect((await ledger(page)).balance).toBe(0);
  await page.locator('[data-ride-action="return"]').first().click();
  await page.locator('#ridesView [data-go="islandView"]').click();
  await earn(page);
  await setupRide(page, 'carousel');
  await expect(page.locator('[data-ride-action="pause"]')).toBeVisible();
  const first = await page.locator('.ride-vehicle').getAttribute('style');
  await expect.poll(() => page.locator('.ride-vehicle').getAttribute('style')).not.toBe(first);
  await page.locator('[data-ride-action="pause"]').click();
  await expect(page.locator('[data-ride-action="pause"]')).toHaveText('繼續');
  await page.locator('[data-ride-action="pause"]').click();
  await page.locator('[data-ride-action="skip"]').click();
  await expect(page.locator('.ride-status')).toContainText('結束');
  expect((await ledger(page)).balance).toBe(0);
  await page.locator('[data-ride-action="return"]').first().click();
  await page.locator('#ridesView [data-go="islandView"]').click();
  await page.locator('#islandView [data-go="collectionView"]').first().click();
  await page.locator('[data-decor="🌻"]').click();
  await expect(page.locator('[data-decor="🌻"]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.locator('#islandView [data-go="collectionView"]').first().click();
  await expect(page.locator('[data-decor="🌻"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#switchChild').click();
  await page.locator('[data-child="child-2"]').click();
  await page.locator('#islandView [data-go="collectionView"]').first().click();
  await expect(page.locator('[data-decor="🌷"]')).toHaveAttribute('aria-pressed', 'true');
  expect((await ledger(page, 'child-2')).balance).toBe(0);
});

test('coaster movement, interruption and reload retain one charge', async ({ page }) => {
  await selectChild(page);
  await earn(page);
  await setupRide(page, 'coaster');
  await expect(page.locator('[data-ride-action="pause"]')).toBeVisible();
  const first = await page.locator('.ride-vehicle').getAttribute('style');
  await expect.poll(() => page.locator('.ride-vehicle').getAttribute('style')).not.toBe(first);
  await page.locator('[data-ride-action="pause"]').click();
  await expect(page.locator('[data-ride-action="pause"]')).toHaveText('繼續');
  await page.reload();
  await expect.poll(async () => (await ledger(page)).balance).toBe(0);
  const state = await ledger(page);
  expect(state.transactions.filter(t => t.type === 'ride_debit')).toHaveLength(1);
});


test('touch targets and island layout fit phone and tablet widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await selectChild(page);
  await page.locator('.island-classic summary').click();
  const mapTargets = page.locator('#islandView .map-place');
  for (const target of await mapTargets.all()) {
    const box = await target.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#islandView .map-place')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
