import { openEditorTools, previewCurrent } from "./editor-helpers";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
});

test("rain preserves every glyph position and changes light over time", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  const result = await page.evaluate(async () => {
    const modulePath = "/src/studio/engine.ts";
    const typesPath = "/src/studio/types.ts";
    const { buildArtwork, drawArtwork, loadImage } = await import(modulePath);
    const { DEFAULTS } = await import(typesPath);
    const image = await loadImage("/samples/portrait.jpg");
    const art = await buildArtwork(image, image.width, image.height, {
      ...DEFAULTS,
      resolution: 60,
    });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    let calls: { args: any[]; alpha: number }[] = [];
    ctx.fillText = ((...args: any[]) => {
      calls.push({ args, alpha: ctx.globalAlpha });
    }) as typeof ctx.fillText;
    drawArtwork(canvas, art);
    const still = calls;
    calls = [];
    drawArtwork(canvas, art, "rain", 0.5);
    const rain = calls;
    calls = [];
    drawArtwork(canvas, art, "rain", 1.8);
    const later = calls;
    return {
      count: rain.length,
      geometrySame:
        JSON.stringify(still.map((c) => c.args)) ===
        JSON.stringify(rain.map((c) => c.args)),
      laterGeometrySame:
        JSON.stringify(rain.map((c) => c.args)) ===
        JSON.stringify(later.map((c) => c.args)),
      changesLight: rain.some(
        (c, i) => Math.abs(c.alpha - later[i].alpha) > 0.05,
      ),
      minimum: Math.min(...rain.map((c) => c.alpha)),
    };
  });
  expect(result.count).toBeGreaterThan(1000);
  expect(result.geometrySame).toBe(true);
  expect(result.laterGeometrySame).toBe(true);
  expect(result.changesLight).toBe(true);
  expect(result.minimum).toBeGreaterThanOrEqual(0.65);
});

test("all 300 names preview the uploaded photo without changing committed settings", async ({ page }) => {
  await page.goto("/#studio");
  await page.getByLabel("Upload an image", { exact: true }).setInputFiles("public/samples/muse.jpg");
  await expect(page.getByRole("button", { name: "Generate artwork", exact: true })).toBeEnabled();
  await expect(page.locator(".preset-select")).toHaveCount(300);
  await expect(page.locator(".source-current-image")).toHaveAttribute("src", /^data:image/);
  const chars = await page.locator("textarea").inputValue();
  await page.getByRole("button", { name: "Ink Contour", exact: true }).hover();
  await expect(page.getByRole("tooltip")).toContainText("Ink Contour");
  await expect(page.getByRole("tooltip").locator("canvas")).toHaveAttribute("data-preview-state", "ready");
  await expect(page.locator("textarea")).toHaveValue(chars);
  await page.locator(".project-title").hover();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(page.getByLabel("Style preview", { exact: true })).toBeHidden();
  await expect(page.locator(".source-current-image")).toBeVisible();
});

test("full backup restores photos and custom styles in a fresh browser without server requests", async ({
  page,
  browser,
}) => {
  const apiRequests: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/"))
      apiRequests.push(r.url());
  });
  await page.goto("/#studio");
  await openEditorTools(page);
  await page
    .getByLabel("Upload an image", { exact: true })
    .setInputFiles("public/samples/muse.jpg");
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Portable portrait");
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("button", { name: "Save as a style", exact: true })
    .click();
  await page.getByLabel("Style name", { exact: true }).fill("Portable style");
  await page.getByRole("button", { name: "Save style", exact: true }).click();
  await page.goto("/#library");
  await expect(
    page.getByRole("heading", { name: "Portable portrait", exact: true }),
  ).toBeVisible();
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download full backup", exact: true })
    .click();
  const downloaded = await event;
  const file = (await downloaded.path())!;
  const backup = JSON.parse(readFileSync(file, "utf8"));
  expect(backup.schema).toBe("pimx-library-v1");
  expect(
    backup.projects.some(
      (p: any) =>
        p.name === "Portable portrait" && p.source.startsWith("data:image/"),
    ),
  ).toBe(true);
  expect(backup.styles.some((s: any) => s.name === "Portable style")).toBe(
    true,
  );
  const fresh = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const other = await fresh.newPage();
  await other.addInitScript(() => localStorage.setItem("language", "en"));
  await other.goto("/#library");
  await expect(
    other.getByRole("heading", { name: "Portable portrait", exact: true }),
  ).toHaveCount(0);
  await other
    .getByLabel("Restore library backup", { exact: true })
    .setInputFiles(file);
  await expect(other.locator(".backup-result")).toContainText("Restored");
  await expect(
    other.getByRole("heading", { name: "Portable portrait", exact: true }),
  ).toBeVisible();
  const count = await other.locator(".project-card").count();
  await other
    .getByLabel("Restore library backup", { exact: true })
    .setInputFiles(file);
  await expect(other.locator(".backup-result")).toContainText("Restored");
  expect(await other.locator(".project-card").count()).toBe(count);
  const bad = {
    ...backup,
    projects: [
      ...backup.projects,
      {
        ...backup.projects[0],
        id: "bad-source",
        source: "https://example.com/hidden.jpg",
      },
    ],
  };
  await other
    .getByLabel("Restore library backup", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(bad)),
    });
  await expect(other.locator(".toast.error")).toBeVisible();
  expect(await other.locator(".project-card").count()).toBe(count);
  await other.goto("/#styles");
  await expect(
    other.getByRole("button", { name: /Portable style ASCII/ }),
  ).toBeVisible();
  expect(apiRequests).toEqual([]);
  await fresh.close();
});

test("leaving the studio immediately flushes edits to the local library", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  await page
    .getByLabel("Upload an image", { exact: true })
    .setInputFiles("public/samples/muse.jpg");
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Immediate local save");
  await page
    .getByRole("slider", { name: "Brightness", exact: true })
    .fill("137");
  await page
    .locator(".desktop-nav")
    .getByRole("link", { name: "Library", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Immediate local save", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Immediate local save", exact: true })
    .click();
  await page.locator("#control-adjust > summary").click();
  await expect(
    page.getByRole("slider", { name: "Brightness", exact: true }),
  ).toHaveValue("137");
});

test("navigation stays at the top and Community is absent", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".home-faq").scrollIntoViewIfNeeded();
  expect(
    await page
      .locator(".site-header")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBe(0);
  await expect(
    page.getByRole("button", { name: "Community", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".desktop-nav")
      .getByRole("link", { name: "Library", exact: true }),
  ).toBeVisible();
});
