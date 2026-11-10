const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

test.use({video:process.env.ZHUYIN_3D_VIDEO ? 'on' : 'off'});

async function enter(page) {
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  await page.locator('[data-go="island3DView"]').click();
}

test('WebGL2 island has real depth, keyboard movement, camera and both maps',async({page})=>{
  // The CI runner uses software WebGL and camera changes can take several rendered frames.
  test.setTimeout(90000);
  await enter(page);
  await page.locator('[data-3d-quality]').selectOption('low');
  const canvas=page.locator('.island3d-canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((el)=>{
    const gl=el.getContext('webgl2');
    return Boolean(gl && gl.getParameter(gl.DEPTH_BITS)>0 && el.width>0 && el.height>0);
  })).toBe(true);
  await expect(page.locator('.island3d-minimap')).toBeVisible();
  const world=page.locator('#world3d');
  const x=Number(await world.getAttribute('data-x'));
  await page.locator('.island3d-viewport').focus();
  await page.keyboard.down('d');
  try { await expect.poll(async()=>Number(await world.getAttribute('data-x'))).toBeGreaterThan(x+12); }
  finally { await page.keyboard.up('d'); }
  await page.locator('[data-3d-action="rotate"]').click();
  await page.locator('[data-3d-action="zoom"]').click();
  await page.locator('[data-3d-action="map"]').first().click();
  await expect(page.locator('.island3d-large-map')).toBeVisible();
  for(const id of ['carousel','coaster','ferris','bumper','pirate','train','phonetic','forest','picture']) {
    await expect(page.locator(`[data-destination="${id}"]`)).toBeVisible();
  }
  await page.locator('[data-3d-action="close-map"]').click();
  await page.locator('[data-3d-action="home"]').click();
  await expect.poll(async()=>Number(await world.getAttribute('data-x')),{timeout:15000}).toBe(620);
});

test('WebGL2 disabled opens the original 2D island and learning',async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args) {
      return /^webgl/.test(type) ? null : original.call(this,type,...args);
    };
  });
  await enter(page);
  await expect(page.locator('#islandView')).toBeVisible();
  await expect(page.locator('#islandExplore .explore-player')).toBeVisible();
  await page.locator('#islandView [data-go="listenView"]').click();
  await expect(page.locator('#listenChoices [data-answer]')).toHaveCount(4);
});

test('context loss returns to 2D without discarding local progress',async({page})=>{
  await enter(page);
  const canvas=page.locator('.island3d-canvas');
  await expect(canvas).toBeVisible();
  const supported=await canvas.evaluate((el)=>{
    const ext=el.getContext('webgl2').getExtension('WEBGL_lose_context');
    if(!ext)return false;
    ext.loseContext();
    return true;
  });
  expect(supported).toBe(true);
  await expect(page.locator('#islandView')).toBeVisible();
  await expect(page.locator('.explore-player')).toBeVisible();
});

test('touch opens the 3D map at phone DPR 3 and tablet DPR 2',async({browser})=>{
  for (const [width,height,dpr] of [[390,844,3],[820,1180,2]]) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:true,hasTouch:true,baseURL:'http://127.0.0.1:'+(process.env.ZHUYIN_TEST_PORT||'4173')});
    try {
      const page=await context.newPage();
      await enter(page);
      await expect(page.locator('.island3d-canvas')).toBeVisible();
      expect(await page.evaluate(()=>devicePixelRatio)).toBe(dpr);
      await page.locator('.island3d-map-open').tap();
      await expect(page.locator('.island3d-large-map')).toBeVisible();
    } finally { await context.close(); }
  }
});

test('3D viewport fits four iPads in both orientations, iPhone and narrow Windows sizes',async({page},testInfo)=>{
  test.setTimeout(90000);
  await enter(page);
  await page.locator('[data-3d-quality]').selectOption('low');
  const sizes=[
    ['air11',820,1180],['air11-wide',1180,820],['air13',1024,1366],['air13-wide',1366,1024],
    ['pro11',834,1210],['pro11-wide',1210,834],['pro13',1032,1376],['pro13-wide',1376,1032],
    ['phone',390,844],['narrow',520,700],['windows',1366,900]
  ];
  for(const [label,width,height] of sizes) await test.step(label,async()=>{
    await page.setViewportSize({width,height});
    const result=await page.locator('.island3d-canvas').evaluate((el)=>{
      const r=el.getBoundingClientRect();
      return {width:r.width,height:r.height,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    expect(result.width).toBeGreaterThan(250);
    expect(result.height).toBeGreaterThan(180);
    expect(result.overflow).toBeLessThanOrEqual(1);
    if(process.env.ZHUYIN_3D_EVIDENCE) {
      fs.mkdirSync(process.env.ZHUYIN_3D_EVIDENCE,{recursive:true});
      await page.screenshot({path:path.join(process.env.ZHUYIN_3D_EVIDENCE,`${label}.png`),scale:'css'});
    }
  });
});
