import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("language", "en"); localStorage.setItem("theme", "dark"); });
});

test("floating preview sits above its style, changes with the uploaded source, and never selects", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/en/studio");
  await page.locator(".preset-search input").fill("Cyberpunk");
  const style = page.getByRole("button", { name: "Cyberpunk", exact: true });
  await style.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip.locator("canvas")).toHaveAttribute("data-preview-state", "ready");
  const original = await tooltip.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const card = await tooltip.boundingBox();
  const button = await style.boundingBox();
  expect(card!.y + card!.height).toBeLessThan(button!.y);
  await expect(style).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await page.getByLabel("Upload an image", { exact: true }).setInputFiles("public/samples/muse.jpg");
  await expect(page.locator(".source-current-image")).toHaveAttribute("src", /^data:/);
  await page.mouse.move(0, 0);
  await style.hover();
  await expect(tooltip.locator("canvas")).toHaveAttribute("data-preview-state", "ready");
  const uploaded = await tooltip.locator("canvas").evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(uploaded).not.toBe(original);
  await style.click();
  await expect(tooltip).toHaveCount(0);
  await expect(style).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("localized routes, theme, browser history and reduced motion work", async ({ page }) => {
  await page.goto("/en/");
  await expect(page).toHaveTitle(/Photo to ASCII/);
  await page.locator(".desktop-nav a[href='/styles']").click();
  await expect(page).toHaveURL(/\/styles$/);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find your next look.");
  await page.getByLabel("Switch language / تغییر زبان").click();
  await expect(page).toHaveURL(/\/styles$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page).toHaveTitle(/۳۰۰/);
  await page.getByLabel("تغییر پوسته").click();
  await expect(page.locator("html")).toHaveClass("light");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".brand").click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator(".dimension-copy h1").evaluate(e => getComputedStyle(e).animationName)).toBe("none");
});

test("mobile preview stays in the viewport in both themes", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: { width: 300, height: 850 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/fa/studio");
  await page.locator(".preset-search input").fill("Cyberpunk");
  const preview = page.getByRole("button", { name: "پیش‌نمایش Cyberpunk", exact: true });
  await preview.tap();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip.locator("canvas")).toHaveAttribute("data-preview-state", "ready");
  const box = await tooltip.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(300);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("تغییر پوسته").tap();
  await expect(page.locator("html")).toHaveClass("light");
  await context.close();
});
