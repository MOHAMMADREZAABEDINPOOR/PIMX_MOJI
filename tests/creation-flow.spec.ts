import { test, expect } from "@playwright/test";
import { MOTIONS } from "../src/studio/motions";

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => { localStorage.setItem("language", "en"); localStorage.setItem("theme", "dark"); });
});

test("studio waits for Generate, and hover previews above the names without selecting", async ({page}) => {
  await page.goto("/#studio");
  await expect(page.locator('.source-current-image')).toBeVisible();
  await expect(page.getByLabel('Style preview', {exact:true})).toBeHidden();
  await expect(page.locator('.preset-select')).toHaveCount(300);
  await expect(page.locator('#control-adjust')).not.toHaveAttribute('open');
  await page.getByLabel('Search all 300 styles').fill('Ink Contour');
  const style = page.getByRole('button', {name:'Ink Contour',exact:true});
  await style.hover();
  await expect(page.getByRole('tooltip').locator('canvas')).toHaveAttribute('data-preview-state','ready');
  await expect(style).toHaveAttribute('aria-pressed','false');
  const stage = await page.getByRole('tooltip').boundingBox();
  const button = await style.boundingBox();
  expect(stage!.y+stage!.height).toBeLessThan(button!.y);
  await style.click();
  await expect(style).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('Style preview', {exact:true})).toBeHidden();
  await expect(page).toHaveURL(/#studio$/);
  await expect(page.getByRole('button',{name:'Download artwork',exact:true})).toHaveCount(0);
});

test("Generate opens a dedicated result, downloads text, survives reload and returns to the same edit", async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#studio');
  await page.getByLabel('Upload an image',{exact:true}).setInputFiles('public/samples/muse.jpg');
  await page.getByLabel('Project name',{exact:true}).fill('A new form');
  await page.getByLabel('Search all 300 styles').fill('Ink Contour');
  await page.getByRole('button',{name:'Ink Contour',exact:true}).click();
  await page.getByRole('button',{name:'Generate artwork',exact:true}).click();
  await expect(page).toHaveURL(/#result$/);
  await expect(page.getByRole('heading',{name:'A new form',exact:true})).toBeVisible();
  await expect(page.getByLabel('Export preview')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.preset-browser')).toHaveCount(0);
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download TXT',exact:true}).click();
  expect((await event).suggestedFilename()).toBe('A new form.txt');
  await page.reload();
  await expect(page.getByLabel('Export preview')).toBeVisible();
  await page.getByRole('button',{name:'Back to editing',exact:true}).click();
  await expect(page.getByLabel('Project name',{exact:true})).toHaveValue('A new form');
  await expect(page.getByLabel('Mark making',{exact:true})).toHaveValue('contour');
  expect(errors).toEqual([]);
});

test("Android touch has a separate Preview beside each style, and Preview does not commit", async ({browser}) => {
  const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width:300,height:850},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.addInitScript(()=>{localStorage.setItem('language','fa');});
  await page.goto('/#studio');
  await page.locator('.preset-search input').fill('Ink Contour');
  const select=page.getByRole('button',{name:'Ink Contour',exact:true});
  const preview=page.getByRole('button',{name:'پیش‌نمایش Ink Contour',exact:true});
  await expect(preview).toBeVisible();
  await preview.scrollIntoViewIfNeeded();
  const a=await select.boundingBox(),b=await preview.boundingBox();
  expect(Math.abs(a!.y-b!.y)).toBeLessThan(2);
  expect(a!.height).toBeGreaterThanOrEqual(44);
  await preview.tap();
  await expect(page.getByRole('tooltip').locator('canvas')).toHaveAttribute('data-preview-state','ready');
  await expect(select).toHaveAttribute('aria-pressed','false');
  await select.tap();
  await expect(select).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'جنریت تصویر',exact:true}).tap();
  await expect(page).toHaveURL(/#result$/);
  await expect(page.getByRole('button',{name:'دانلود اثر',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await context.close();
});

test("all 18 motion choices render real distinct movement and remain valid in backups", async ({page}) => {
  expect(MOTIONS).toHaveLength(18);
  await page.goto('/#studio');
  await expect(page.locator('#control-motion')).toHaveCount(0);
  await page.getByRole('button',{name:'Generate artwork',exact:true}).click();
  await expect(page.locator('.result-motion-grid button')).toHaveCount(18);
  const motionChecks=await page.evaluate(async()=>{
    const enginePath='/src/studio/engine.ts', motionPath='/src/studio/motions.ts', typePath='/src/studio/types.ts', storagePath='/src/studio/storage.ts';
    const {buildArtwork,drawArtwork,loadImage}=await import(enginePath);
    const {MOTIONS}=await import(motionPath); const {DEFAULTS}=await import(typePath);const {restoreLibrary,exportLibrary}=await import(storagePath);
    const image=await loadImage('/samples/portrait.jpg'); const art=await buildArtwork(image,image.width,image.height,{...DEFAULTS,resolution:45});
    const checks = [];
    for (const {id} of MOTIONS) {
      const canvas=document.createElement('canvas');
      drawArtwork(canvas,art,id,.4,220);const first=canvas.toDataURL();drawArtwork(canvas,art,id,1.3,220);
      const p={id:'motion-'+id,name:id,source:'/samples/portrait.jpg',thumbnail:canvas.toDataURL(),options:DEFAULTS,effect:id,updated:Date.now()};
      await restoreLibrary({schema:'pimx-library-v1',exportedAt:new Date().toISOString(),projects:[p],styles:[]});
      const valid=await exportLibrary();
      checks.push({id,changed:first!==canvas.toDataURL(),saved:valid.projects.find((project: {id:string}) => project.id === p.id).effect});
    }
    return checks;
  });
  for(const entry of motionChecks) {expect(entry.saved).toBe(entry.id);expect(entry.changed,entry.id).toBe(entry.id!=='still');}
});

test("a direct result link without a saved generation has a useful recovery",async({page})=>{
  await page.goto('/#result');
  await expect(page.getByRole('button',{name:'Open studio',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Open studio',exact:true}).click();
  await expect(page.getByRole('button',{name:'Generate artwork',exact:true})).toBeVisible();
});

test("a browser storage failure still opens the generated image and allows downloading", async ({page}) => {
  await page.goto('/#studio');
  await expect(page.getByRole('button',{name:'Generate artwork',exact:true})).toBeEnabled();
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function() { throw new DOMException('Storage full', 'QuotaExceededError'); };
  });
  await page.getByRole('button',{name:'Generate artwork',exact:true}).click();
  await expect(page).toHaveURL(/#result$/);
  await expect(page.getByText('Not saved in this browser. Download a copy to keep it.')).toBeVisible();
  const event=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download artwork',exact:true}).click();
  expect((await event).suggestedFilename()).toMatch(/\.png$/);
});
