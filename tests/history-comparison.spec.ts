import { test, expect } from "@playwright/test";

for (const language of ["en", "fa"]) {
  test(`history compares saved originals and artwork in ${language}`, async ({ page }) => {
    await page.addInitScript(lang => { localStorage.setItem("language", lang); localStorage.setItem("theme", "dark"); }, language);
    await page.goto("/library");
    await page.getByRole("heading", { name: language === "en" ? "Your first experiment is waiting." : "\u062c\u0627\u06cc \u0627\u0648\u0644\u06cc\u0646 \u0627\u062b\u0631\u062a \u0627\u06cc\u0646\u062c\u0627\u0633\u062a." }).waitFor();
    await page.evaluate(async () => {
      const storagePath = "/src/studio/storage.ts", typesPath = "/src/studio/types.ts";
      const { saveProjects } = await import(storagePath);
      const { DEFAULTS } = await import(typesPath);
      await saveProjects([0, 1, 2].map(i => ({ id: `comparison-${i}`, name: `Portrait ${i + 1}`, source: "/samples/portrait.jpg", thumbnail: "/samples/portrait.jpg", updated: Date.now() - i, effect: "still", options: { ...DEFAULTS, resolution: i === 2 ? 400 : 90, textColor: ["#a8baff", "#f2c55e", "#c9b5ff"][i], chars: " .:=+#@" } })));
    });
    await page.reload();
    const card = page.locator(".project-card").first();
    const comparison = card.locator(".project-comparison");
    await comparison.scrollIntoViewIfNeeded();
    await expect(comparison.locator("canvas")).toHaveAttribute("data-preview-state", "ready");
    await expect(comparison.getByText(language === "en" ? "Before" : "\u0642\u0628\u0644", { exact: true })).toBeVisible();
    await expect(comparison.getByText(language === "en" ? "After" : "\u0628\u0639\u062f", { exact: true })).toBeVisible();
    const slider = comparison.getByRole("slider");
    await expect(slider).toHaveValue("50");
    await slider.focus(); await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");
    await expect(comparison.locator(".project-comparison-result")).toHaveAttribute("style", /100%/);
    await page.keyboard.press("Home"); await expect(slider).toHaveValue("0");
    await slider.fill("50");
    const box = await slider.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down(); await page.mouse.move(box!.x + box!.width * .8, box!.y + box!.height / 2); await page.mouse.up();
    expect(Number(await slider.inputValue())).toBeGreaterThan(65);
    await slider.fill("50");
    await page.screenshot({ path: test.info().outputPath(`history-${language}-desktop.png`), fullPage: true });
    const originalView = page.getByRole("button", { name: language === "en" ? "Original photos" : "\u0639\u06a9\u0633\u200c\u0647\u0627\u06cc \u0627\u0635\u0644\u06cc", exact: true });
    await originalView.click(); await expect(page.locator(".project-comparison")).toHaveCount(0);
    await expect(card.locator(".project-image > img")).toHaveAttribute("src", "/samples/portrait.jpg");
    await page.getByRole("button", { name: language === "en" ? "Before & after" : "\u0642\u0628\u0644 \u0648 \u0628\u0639\u062f", exact: true }).click();
    for (const width of [300, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await comparison.scrollIntoViewIfNeeded();
      await expect(comparison.locator("canvas")).toHaveAttribute("data-preview-state", "ready");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`history-${language}-${width}.png`), fullPage: true });
    }
    await card.getByRole("heading", { name: "Portrait 1", exact: true }).click();
    await expect(page).toHaveURL(/studio/);
  });
}

test("comparison responds to touch dragging and allows vertical page scrolling", async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
 const page = await context.newPage();
 await page.addInitScript(() => localStorage.setItem("language", "en"));
 await page.goto("/studio");
 await page.getByRole("button", { name: /Generate artwork|\u062c\u0646\u0631\u06cc\u062a \u062a\u0635\u0648\u06cc\u0631/ }).click();
 await page.waitForURL("**/result");
 await page.goto("/library");
 const slider=page.locator(".project-comparison-slider").first();
 await slider.scrollIntoViewIfNeeded();
 const box=await slider.boundingBox();
 const session=await context.newCDPSession(page);
 const x=box!.x+box!.width*.5, y=box!.y+box!.height*.5;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for (let step=1;step<=5;step++) { await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+step*14,y}]}); await page.waitForTimeout(16); }
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(async()=>Number(await slider.inputValue())).toBeGreaterThan(60);
 const before=await page.evaluate(()=>scrollY);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-80}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before);
 await context.close();
});
