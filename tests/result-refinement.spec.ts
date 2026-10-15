import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem("language")) localStorage.setItem("language", "en"); if (!localStorage.getItem("theme")) localStorage.setItem("theme", "dark"); });
});

test("FAQ opens and closes smoothly with keyboard and reduced motion", async ({ page }) => {
  await page.goto("/");
  const question = page.getByRole("button", { name: "Where are my photos saved?", exact: true });
  await question.scrollIntoViewIfNeeded();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(question).toHaveAttribute("aria-expanded", "true");
  const answer = page.locator('.faq-item').first().locator('.faq-answer');
  await expect.poll(() => answer.evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThan(40);
  expect(await answer.evaluate(e => getComputedStyle(e).transitionProperty)).toContain("grid-template-rows");
  await question.click();
  await expect.poll(() => answer.evaluate(e => Math.round(e.getBoundingClientRect().height))).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
});

test("result has motion, image-only viewer, styled size choices and real pan and zoom", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/studio");
  await expect(page.locator("#control-motion")).toHaveCount(0);
  await page.getByRole("button", { name: "Generate artwork", exact: true }).click();
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".result-motion-grid button")).toHaveCount(18);
  await expect(page.locator(".checkerboard")).toHaveCount(0);
  const size = page.getByRole("combobox", { name: "Canvas size" });
  await size.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(size).toContainText("Story");
  const art = page.getByLabel("Export preview", { exact: true });
  await expect.poll(() => art.evaluate((c: HTMLCanvasElement) => Math.round(c.width / c.height * 100))).toBe(56);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByLabel("Zoom level", { exact: true })).toHaveText("125%");
  await page.getByRole("button", { name: "Fit", exact: true }).click();
  await expect(page.getByLabel("Zoom level", { exact: true })).toHaveText("100%");
  await page.getByRole("button", { name: "Open large", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const viewport = dialog.getByRole("region", { name: "Artwork viewer" });
  await viewport.focus(); await page.keyboard.press("+");
  await expect(dialog.getByLabel("Zoom level")).toHaveText("125%");
  const box = await viewport.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2 + 20); await page.mouse.up();
  await expect(dialog.getByLabel("Export preview")).toHaveAttribute("style", /translate\(40px, 20px\)/);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Wave", exact: true }).click();
  await expect(page.getByRole("button", { name: "Wave", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Wave", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("language preference survives reload while URLs and navigation have no language prefix", async ({ page }) => {
  await page.goto("/studio");
  await page.getByLabel("Switch language / تغییر زبان").click();
  await expect(page).toHaveURL(/\/studio$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "تاریخچه", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator('a[href^="/fa"], a[href^="/en"]')).toHaveCount(0);
});
