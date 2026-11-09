const {test,expect}=require('@playwright/test');
const key='zhuyin-island-explore-v1-child-1';

test('a malformed exploration record survives opening, movement and leaving', async ({page}) => {
  const raw = '{"version":1,"position":';
  await page.goto('/');
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
  await page.locator('[data-child="child-1"]').click();
  await expect(page.locator('.explore-player')).toBeVisible();
  await page.locator('[data-explore-reset]').click();
  await page.locator('#islandView [data-go="learnView"]').click();
  expect(await page.evaluate((key)=>localStorage.getItem(key),key)).toBe(raw);
});

test('reduced motion retains controls and pauses NPC updates when hidden',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  const scene=page.locator('.explore-viewport'), player=page.locator('.explore-player');
  await scene.focus();
  const initial=await player.getAttribute('data-x');
  await page.keyboard.down('d');
  await expect.poll(()=>player.getAttribute('data-x')).not.toBe(initial);
  expect(await player.locator('.leg-left').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.keyboard.up('d');
  await expect(player).toHaveAttribute('data-moving','false');
  await expect(page.locator('.explore-npc[data-moving="true"]')).toHaveCount(0);
});
