const {test,expect} = require('@playwright/test');
const active = (page,mode) => page.evaluate(async (mode) => {
  const ledger = await TicketLedger.open();
  try {
    const s = await ledger.get('child-1');
    return { round:s.rounds[s.activeRounds[mode]], balance:s.balance, stats:s.stats, stars:s.stars };
  } finally { ledger.close(); }
},mode);
const go = (page, view) => page.locator(`#islandView [data-go="${view}"]`).first().click();

test('learning entrances, tone positions and explicit spelling rounds',async ({page})=>{
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  await go(page,'cardsView');
  await page.locator('#symbolCards [data-play-zhuyin]').first().click();
  expect((await active(page,'listen')).balance).toBe(0);
  await page.locator('#islandHome').click();
  await go(page,'learnView');
  await expect(page.locator('#learnCards .symbol-card')).toHaveCount(37);
  await expect(page.locator('#learnCards .symbol-card').filter({has:page.locator('[data-play-zhuyin="ㄢ"]')})).toContainText('山');
  await expect(page.locator('#learnCards .symbol-card').filter({has:page.locator('[data-play-zhuyin="ㄣ"]')}).locator('.tone-2 .zhuyin-tone')).toHaveText('ˊ');
  await page.locator('#islandHome').click();
  await go(page,'spellView');
  await expect(page.locator('#spellChoices .zhuyin-answer-single')).toHaveCount(4);
  const b = (await active(page,'spell:beginner')).round;
  await page.locator(`#spellChoices button:not([data-option-id="${b.correctId}"])`).first().click();
  await expect(page.locator('#spellFeedback')).toContainText('再試一次');
  await page.locator(`#spellChoices [data-option-id="${b.correctId}"]`).click();
  await expect(page.locator('#spellFeedback')).toContainText('獲得 1 張');
  const a = await active(page,'spell:beginner');
  expect(a.stats.firstCorrect).toBe(0);
  expect(a.stats.firstAnswered).toBe(1);
  expect(a.stats.retries).toBe(1);
  expect(a.stats.completed).toBe(1);
  await page.locator('#difficulty').selectOption('advanced');
  await expect(page.locator('#spellChoices .zhuyin-answer-syllable')).toHaveCount(4);
  await page.locator('#difficulty').selectOption('beginner');
  await expect(page.locator('#nextSpell')).toBeVisible();
  expect((await active(page,'spell:beginner')).round.id).toBe(b.id);
  await page.locator('#nextSpell').click();
  await expect(page.locator('#nextSpell')).toBeHidden();
  expect((await active(page,'spell:beginner')).round.id).not.toBe(b.id);
});
test('two browser tabs and rapid clicks settle one round once',async ({page,context})=>{
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  await go(page,'listenView');
  await expect(page.locator('#listenChoices button')).toHaveCount(4);
  const other = await context.newPage();
  await other.goto('/');
  await go(other,'listenView');
  await expect(other.locator('#listenChoices button')).toHaveCount(4);
  const round = (await active(page,'listen')).round;
  expect((await active(other,'listen')).round.id).toBe(round.id);
  const rapid = (p) => p.evaluate((key) => {
    const btn = document.querySelector(`#listenChoices [data-answer="${key}"]`);
    btn.click(); btn.click();
  },round.correctId);
  await Promise.all([rapid(page),rapid(other)]);
  await expect.poll(async()=> (await active(page,'listen')).balance).toBe(1);
  const result = await active(page,'listen');
  expect(result.stars).toBe(1);
  expect(result.round.attemptCount).toBe(1);
  expect(result.stats.completed).toBe(1);
});
