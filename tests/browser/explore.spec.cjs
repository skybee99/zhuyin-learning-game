const { test, expect } = require('@playwright/test');

const player = page => page.locator('#islandExplore .explore-player');
const position = page => player(page).evaluate(el => ({x:Number(el.dataset.x),y:Number(el.dataset.y)}));
async function start(page, initial) {
  await page.addInitScript(({initial}) => {
    const key='zhuyin-island-explore-v1-child-1';
    if (initial && !localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify({version:1,position:initial,facing:'down',appearance:{hair:'short',color:'#ee8f83',accessory:'none'}}));
    if (window.speechSynthesis) window.speechSynthesis.speak = utterance => { window.__spoken = (window.__spoken || []).concat(utterance.text); };
  },{initial});
  await page.goto('/');
  const choice=page.locator('[data-child="child-1"]');
  if (await choice.isVisible()) await choice.click();
  await expect(player(page)).toBeVisible();
}
async function state(page,id='child-1') { return page.evaluate(async id=>{const l=await TicketLedger.open();try{return await l.get(id)}finally{l.close()}},id); }
async function earn(page) {
  await page.locator('#islandView [data-go="listenView"]').first().click();
  await expect(page.locator('#listenChoices [data-answer]').first()).toBeVisible();
  const s=await state(page), id=s.rounds[s.activeRounds.listen].correctId;
  await page.locator('#listenChoices [data-answer]').filter({hasText:id}).first().click();
  await expect.poll(async ()=>(await state(page)).balance).toBe(1);
  await page.locator('#islandHome').click();
  await expect(player(page)).toBeVisible();
}
async function hold(page,key,dir) {
  const viewport=page.locator('.explore-viewport');await viewport.focus();
  await page.keyboard.down(key);
  await expect(player(page)).toHaveAttribute('data-facing',dir);
  await expect(player(page)).toHaveAttribute('data-moving','true');
  await page.keyboard.up(key);
  await expect(player(page)).toHaveAttribute('data-moving','false');
}

test.use({viewport:{width:1280,height:1000},hasTouch:true});
test.setTimeout(90000);

test('WASD and arrows show walking direction and stop on release',async ({page})=>{
  await start(page);
  const original=await position(page);
  for(const [key,dir] of [['w','up'],['d','right'],['s','down'],['a','left'],['ArrowUp','up'],['ArrowRight','right'],['ArrowDown','down'],['ArrowLeft','left']]) await hold(page,key,dir);
  const after=await position(page);
  expect(await page.evaluate(p=>IslandWorld.isWalkable(p.x,p.y),after)).toBe(true);
  expect(Number.isFinite(original.x)).toBe(true);
});

test('touch joystick moves and immediately stops on release',async ({page,context})=>{
  await start(page);
  const stick=page.locator('.explore-stick');await stick.scrollIntoViewIfNeeded();const b=await stick.boundingBox();
  const cdp=await context.newCDPSession(page), x=b.x+b.width/2,y=b.y+b.height/2;
  const before=await position(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y,id:1}]});
  await expect(player(page)).toHaveAttribute('data-moving','true');
  await expect(player(page)).toHaveAttribute('data-facing','right');
  await expect.poll(async()=>(await position(page)).x).toBeGreaterThan(before.x+3);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(player(page)).toHaveAttribute('data-moving','false');
  const stopped=await position(page);await page.waitForTimeout(180);expect(await position(page)).toEqual(stopped);
});

test('click-to-walk follows a safe route to an entrance and stops outside the building',async ({page})=>{
  await start(page,{x:620,y:300});
  await page.evaluate(()=>{window.__track=[];const sample=()=>{const p=document.querySelector('.explore-player');if(p)window.__track.push({x:+p.dataset.x,y:+p.dataset.y});window.__trackId=requestAnimationFrame(sample)};sample()});
  await page.locator('[data-object="village"]').click();
  await expect(player(page)).toHaveAttribute('data-moving','true');
  await expect(page.locator('.explore-near')).toContainText('學習動物村',{timeout:12000});
  await expect(player(page)).toHaveAttribute('data-moving','false',{timeout:12000});
  const samples=await page.evaluate(()=>{cancelAnimationFrame(window.__trackId);return window.__track.map(p=>IslandWorld.isWalkable(p.x,p.y));});
  expect(samples.length).toBeGreaterThan(5);expect(samples.every(Boolean)).toBe(true);
  const p=await position(page);expect(Math.hypot(p.x-220,p.y-300)).toBeLessThan(10);
});

test('NPC wanders, stops for dialog, speaks and returns to island',async ({page})=>{
  await start(page,{x:540,y:340});
  const npc=page.locator('[data-npc="rabbit"]');const before=await npc.getAttribute('style');
  await expect.poll(()=>npc.getAttribute('style'),{timeout:9000}).not.toBe(before);
  await npc.click();const dialog=page.locator('[data-explore-dialog]');
  await expect(dialog).toBeVisible({timeout:9000});await expect(dialog).toContainText('小兔');
  const paused=await npc.getAttribute('style');await page.waitForTimeout(500);expect(await npc.getAttribute('style')).toBe(paused);
  await page.locator('[data-dialog-speak]').click();await expect.poll(()=>page.evaluate(()=>window.__spoken?.length||0)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await npc.click();
  await page.locator('[data-dialog-enter]').click();
  await expect(page.locator('#cardsView')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(player(page)).toBeVisible();
});

for(const [ride,startAt,label] of [['carousel',{x:680,y:300},'旋轉木馬'],['coaster',{x:900,y:300},'雲霄飛車']]) {
  test(`walk to ${label}, use existing ticket ledger and return`,async ({page})=>{
    await start(page,startAt);await earn(page);
    await page.locator(`[data-object="${ride}"]`).click();
    await expect(page.locator('.explore-near')).toContainText(label,{timeout:10000});
    await expect(page.locator('.explore-near')).toContainText('1 張');
    await page.locator('.explore-interact').click();
    await expect(page.locator('#ridesView')).toBeVisible();
    await page.locator('[data-ride-action="confirm"]').click();await page.locator('[data-ride-action="start"]').click();
    await expect(page.locator('[data-ride-action="skip"]')).toBeVisible();
    await expect.poll(async()=>(await state(page)).balance).toBe(0);
    const s=await state(page);expect(s.transactions.filter(t=>t.type==='ride_debit')).toHaveLength(1);
    await page.locator('[data-ride-action="skip"]').click();
    await page.locator('[data-ride-action="return"]').first().click();await expect(player(page)).toBeVisible();
    const p=await position(page),target=await page.evaluate(id=>IslandWorld.entrances.find(e=>e.id===id),ride);
    expect(Math.hypot(p.x-target.x,p.y-target.y)).toBeLessThan(75);
  });
}

test('position and appearance persist independently after reload and child switch',async ({page})=>{
  await start(page);await page.locator('[data-explore-wardrobe]').click();
  await page.locator('[data-appearance="hair"]').selectOption('bob');
  await page.locator('[data-appearance="accessory"]').selectOption('star');
  await hold(page,'ArrowRight','right');
  const saved=await position(page);
  await page.reload();await expect(player(page)).toBeVisible();
  expect(await position(page)).toEqual(saved);
  await page.locator('[data-explore-wardrobe]').click();
  await expect(page.locator('[data-appearance="hair"]')).toHaveValue('bob');
  await expect(page.locator('[data-appearance="accessory"]')).toHaveValue('star');
  await page.locator('#switchChild').click();await page.locator('[data-child="child-2"]').click();
  await expect(player(page)).toBeVisible();await page.locator('[data-explore-wardrobe]').click();
  await expect(page.locator('[data-appearance="hair"]')).toHaveValue('short');
  await expect(page.locator('[data-appearance="accessory"]')).toHaveValue('none');
  expect(await position(page)).toEqual({x:620,y:420});
  await page.locator('#switchChild').click();await page.locator('[data-child="child-1"]').click();
  expect(await position(page)).toEqual(saved);
});
