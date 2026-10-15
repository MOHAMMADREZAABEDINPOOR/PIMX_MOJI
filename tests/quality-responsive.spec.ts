import { test, expect } from "@playwright/test";

test("400-column emoji art keeps full-resolution PNG pixels and yields to input", async ({ page }) => {
  await page.goto("/studio");
  const result = await page.evaluate(async () => {
    const enginePath = "/src/studio/engine.ts", typesPath = "/src/studio/types.ts", storagePath = "/src/studio/storage.ts";
    const { buildArtwork, drawArtworkAsync, loadImage } = await import(enginePath);
    const { DEFAULTS } = await import(typesPath);
    const { validateOptions } = await import(storagePath);
    const options = validateOptions({ ...DEFAULTS, mode: "emoji", chars: "\u{1f499}\u{1f49b}", resolution: 400, threshold: 0 });
    const image = await loadImage("/samples/portrait.jpg");
    let ticks = 0;
    const timer = setInterval(() => ticks++, 0);
    const art = await buildArtwork(image, image.width, image.height, options);
    const canvas = document.createElement("canvas");
    await drawArtworkAsync(canvas, art);
    clearInterval(timer);
    return { columns: art.columns, width: canvas.width, height: canvas.height, ticks, opaque: canvas.getContext("2d")!.getImageData(0, 0, 1, 1).data[3] };
  });
  expect(result.columns).toBe(400);
  expect(result.width).toBeGreaterThan(4000);
  expect(result.height).toBeGreaterThan(2600);
  expect(result.width).toBeLessThanOrEqual(8192);
  expect(result.ticks).toBeGreaterThan(2);
  expect(result.opaque).toBe(255);
});

test("studio controls fit narrow and tablet screens in both languages", async ({ page }) => {
  for (const language of ["en", "fa"]) {
    await page.addInitScript(lang => localStorage.setItem("language", lang), language);
    for (const width of [300, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/studio");
      await expect(page.locator(".preset-select").first()).toBeVisible();
      const overflow = await page.evaluate(() => [...document.querySelectorAll(".studio-shell button, .studio-shell input")].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && !e.closest(".preset-name-list") && (r.left < -1 || r.right > innerWidth + 1);
      }).map(e => e.className));
      expect(overflow, `${language} ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390 || width === 1024) await page.screenshot({ path: `test-results/studio-${language}-${width}.png`, fullPage: true });
    }
  }
});
