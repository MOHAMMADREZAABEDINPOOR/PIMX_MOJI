import { openEditorTools, previewCurrent } from "./editor-helpers";
import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
});
test("home, editor, undo, private project persistence and style files", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Pixels.*Reimagined/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Try the playground" }).click();
  await openEditorTools(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  const original = await page
    .locator('canvas[aria-label="Style preview"]')
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole("button", { name: "Ww Words" }).click();
  await page.locator("textarea").fill("HELLO WORLD");
  await previewCurrent(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() =>
      page
        .locator('canvas[aria-label="Style preview"]')
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    )
    .not.toBe(original);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator("textarea")).toHaveValue("MAKE ART");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator("textarea")).toHaveValue("HELLO WORLD");
  await page.getByRole("button", { name: "Save as a style" }).click();
  await page.getByLabel("Style name", { exact: true }).fill("My lime print");
  await page.getByRole("button", { name: "Save style", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Persistent portrait");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Project saved to your library.")).toBeVisible();
  await previewCurrent(page);
  await page.getByRole("button", { name: "Before / after" }).click();
  await page
    .getByRole("slider", { name: "Before and after comparison" })
    .fill("30");
  await page.screenshot({
    path: "test-results/studio-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Persistent portrait" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Persistent portrait" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Style lab", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Aa My lime print MOSAIC/ }),
  ).toBeVisible();
  await page.getByPlaceholder("Find a style…").fill("matrix rain");
  await expect(page.locator(".styles-grid .style-card")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("PNG template, animated GIF and video produce real downloads", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  await page.getByRole("button", { name: "Generate artwork", exact: true }).click();
  await page.getByRole("combobox", { name: "Canvas size" }).click();
  await page.getByRole("option", { name: /Story/ }).click();
  await page.getByLabel("Your signature (optional)").fill("PIMX TEST");
  const pngEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download artwork" }).click();
  const png = await pngEvent;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  const path = await png.path();
  const { readFileSync } = await import("node:fs");
  const bytes = readFileSync(path!);
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1920);
  await page.getByRole("button", { name: "GIF", exact: true }).click();
  const gifEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download artwork" }).click();
  const gif = await gifEvent;
  const gifBytes = readFileSync((await gif.path())!);
  expect(gifBytes.subarray(0, 6).toString()).toMatch(/^GIF8[79]a$/);
  expect(gifBytes.length).toBeGreaterThan(10000);
  await expect(
    page.getByRole("button", { name: "Video", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Video", exact: true }).click();
  const movieEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download artwork" }).click();
  const movie = await movieEvent;
  expect(movie.suggestedFilename()).toMatch(/\.(webm|mp4)$/);
  expect(readFileSync((await movie.path())!).length).toBeGreaterThan(1000);
});
test("mobile Persian layout, navigation and tools stay within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch language / تغییر زبان" })
    .click();
  await expect(page.locator(".app-shell")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: "test-results/home-mobile-fa.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "بازکردن منو", exact: true }).click();
  await page
    .locator(".mobile-nav")
    .getByRole("button", { name: "استودیو" })
    .click();
  await expect(
    page.getByRole("button", { name: "جنریت تصویر", exact: true }),
  ).toBeEnabled();
  await page.locator("#control-adjust > summary").click();
  await page
    .getByRole("slider", { name: "تراکم", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("slider", { name: "تراکم", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/studio-mobile-fa.png",
    fullPage: true,
  });
  // Settings share one continuous page; returning to the canvas needs no modal.
  await expect(page.locator(".settings-section")).toHaveCount(4);
  await expect(page.getByLabel("جست‌وجوی ۳۰۰ سبک")).toBeAttached();
  const frame = page.locator(".canvas-frame");
  await page.getByRole("button", { name: "پیش‌نمایش انتخاب", exact: true }).click();
  await expect(page.getByLabel("پیش‌نمایش استایل", { exact: true })).toBeVisible();
  const beforeZoom = await frame.evaluate(
    (el) => el.getBoundingClientRect().width,
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() => frame.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(beforeZoom);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
