const {test,expect}=require('@playwright/test');

test('Windows-sized canvas fits normal and narrow windows and effective zoom widths', async ({page}) => {
  await page.setViewportSize({width:1366,height:900});
  await page.goto('/');
  await page.locator('[data-child="child-1"]').click();
  // These are effective CSS viewport sizes, not changes to the browser zoom setting.
  for (const [name,width,height] of [
    ['large',1366,900], ['windowed',1000,700],
    ['125%-equivalent',800,560], ['150%-equivalent',667,467]
  ]) {
    await test.step(name,async()=>{
      await page.setViewportSize({width,height});
      const geometry = await page.locator('.explore-viewport').evaluate((scene)=>{
        const sceneBox = scene.getBoundingClientRect();
        const avatar = scene.querySelector('.explore-player').getBoundingClientRect();
        return { overflow:document.documentElement.scrollWidth-innerWidth, scene:[sceneBox.left,sceneBox.right], avatar:[avatar.left,avatar.right,avatar.height] };
      });
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      expect(geometry.avatar[0]).toBeGreaterThanOrEqual(geometry.scene[0]);
      expect(geometry.avatar[1]).toBeLessThanOrEqual(geometry.scene[1]);
      expect(geometry.avatar[2]).toBeGreaterThanOrEqual(60);
    });
  }
});
