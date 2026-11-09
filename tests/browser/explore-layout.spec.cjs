const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// These are synthetic CSS viewport/DPR cases in Chromium, not Apple device tests.
const cases = [
  ['iPad Air M2 11 portrait', 820,1180,2], ['iPad Air M2 11 landscape',1180,820,2],
  ['iPad Air M2 13 portrait',1024,1366,2], ['iPad Air M2 13 landscape',1366,1024,2],
  ['iPad Pro M4 11 portrait',834,1210,2], ['iPad Pro M4 11 landscape',1210,834,2],
  ['iPad Pro M4 13 portrait',1032,1376,2], ['iPad Pro M4 13 landscape',1376,1032,2],
  ['iPhone portrait',390,844,3]
];

async function openIsland(page, baseURL) {
  await page.addInitScript(() => { if (window.speechSynthesis) window.speechSynthesis.speak = () => {}; });
  await page.goto(baseURL + '/');
  await page.locator('[data-child="child-1"]').click();
  await expect(page.locator('#islandView')).toBeVisible();
  await expect(page.locator('#islandExplore .explore-viewport')).toBeVisible();
}

async function checkLayout(page, expectedDpr) {
  const island = page.locator('#islandExplore');
  const viewport = island.locator('.explore-viewport');
  const player = island.locator('.explore-player');
  const tools = island.locator('.explore-tools');
  await expect(island).toBeVisible();
  await expect(viewport).toBeVisible();
  await expect(player).toBeVisible();
  await expect(tools).toBeVisible();
  await expect(island.locator('[data-explore-reset]')).toBeVisible();
  await expect(island.locator('[data-explore-wardrobe]')).toBeVisible();
  await expect(island.locator('[data-explore-stick-toggle]')).toBeVisible();
  const dimensions = await page.evaluate(() => {
    const rect = (selector) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    const viewport = rect('#islandExplore .explore-viewport');
    const player = rect('#islandExplore .explore-player');
    const buttons = [...document.querySelectorAll('#islandExplore .explore-tools button')].map(el => {
      const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width,height:r.height};
    });
    return {innerWidth, dpr:devicePixelRatio, scrollWidth:document.documentElement.scrollWidth, viewport, player, buttons};
  });
  expect(dimensions.dpr).toBe(expectedDpr);
  expect(dimensions.scrollWidth, 'page must not overflow horizontally').toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.viewport.left).toBeGreaterThanOrEqual(-1);
  expect(dimensions.viewport.right).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.viewport.width).toBeGreaterThanOrEqual(250);
  expect(dimensions.viewport.height).toBeGreaterThanOrEqual(390);
  expect(dimensions.player.width).toBeGreaterThanOrEqual(50);
  expect(dimensions.player.height).toBeGreaterThanOrEqual(70);
  // A CSS-visible player outside the clipped map is not actually visible to the child.
  expect(dimensions.player.left).toBeGreaterThanOrEqual(dimensions.viewport.left - 1);
  expect(dimensions.player.right).toBeLessThanOrEqual(dimensions.viewport.right + 1);
  expect(dimensions.player.top).toBeGreaterThanOrEqual(dimensions.viewport.top - 1);
  expect(dimensions.player.bottom).toBeLessThanOrEqual(dimensions.viewport.bottom + 1);
  expect(dimensions.buttons).toHaveLength(3);
  for (const button of dimensions.buttons) {
    expect(button.width).toBeGreaterThanOrEqual(48);
    expect(button.height).toBeGreaterThanOrEqual(48);
    expect(button.left).toBeGreaterThanOrEqual(-1);
    expect(button.right).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  }
}

async function evidence(page, testInfo, label) {
  if (!process.env.ZHUYIN_LAYOUT_EVIDENCE) return;
  const filename = label.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + randomUUID() + '.png';
  const dir = path.resolve(process.env.ZHUYIN_LAYOUT_EVIDENCE);
  fs.mkdirSync(dir,{recursive:true});
  const file = path.join(dir,filename);
  await page.screenshot({path:file, fullPage:true, animations:'disabled', scale:'css'});
  await testInfo.attach(label, {path:file, contentType:'image/png'});
}

for (const [label,width,height,dpr] of cases) {
  test(`synthetic Chromium layout: ${label}, ${width}x${height}, DPR ${dpr}`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({ viewport:{width,height}, deviceScaleFactor:dpr });
    try {
      const page = await context.newPage();
      await openIsland(page, baseURL);
      await checkLayout(page,dpr);
      await evidence(page,testInfo,label);
    } finally { await context.close(); }
  });
}

for (const dpr of [2,3]) {
  test(`synthetic Chromium live window resize: split and narrow, DPR ${dpr}`, async ({ browser, baseURL }, testInfo) => {
    const context = await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:dpr});
    try {
      const page = await context.newPage();
      await openIsland(page,baseURL);
      for (const size of [{width:1024,height:768},{width:600,height:900},{width:390,height:844},{width:820,height:1180}]) {
        await page.setViewportSize(size);
        await checkLayout(page,dpr);
        await evidence(page,testInfo,`resize-${size.width}x${size.height}-dpr${dpr}`);
      }
    } finally { await context.close(); }
  });
}
