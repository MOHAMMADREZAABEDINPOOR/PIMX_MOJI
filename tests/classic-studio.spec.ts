import { openEditorTools, previewCurrent } from "./editor-helpers";
import { test, expect } from "@playwright/test";
import { PRESETS } from "../src/constants/presets";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
});
test("replacement styles use 17 mark-making methods without the old cloned additions", () => {
  const added = PRESETS.slice(0, 148);
  expect(PRESETS).toHaveLength(300);
  expect(new Set(added.map((p) => p.options.treatment)).size).toBe(17);
  expect(added.every((p) => p.id.startsWith("craft-"))).toBe(true);
  expect(added.some((p) => / (Soft|Micro|High Contrast)$/.test(p.name))).toBe(
    false,
  );
  expect(
    PRESETS.some((p) => p.id === "photon_0" || p.id === "spectral_0"),
  ).toBe(false);
});
test("source/history and configuration form two columns while all tools remain available", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  const source = await page.locator(".source-pane").boundingBox();
  const settings = await page.locator(".configuration-pane").boundingBox();
  expect(source!.x + source!.width).toBeLessThan(settings!.x);
  expect(settings!.width).toBeGreaterThan(source!.width);
  await expect(
    page.locator(".studio-history > summary"),
  ).toBeVisible();
  await expect(page.locator(".preset-name-list .preset-select")).toHaveCount(300);
  for (const name of ["Density", "Brightness", "Brush size"])
    await expect(
      page.getByRole("slider", { name, exact: true }),
    ).toBeAttached();
  await expect(
    page.getByRole("checkbox", { name: "Enable brush", exact: true }),
  ).toBeAttached();
  await expect(page.locator("#control-motion")).toHaveCount(0);
  await expect(page.getByLabel("Mark making", { exact: true })).toBeAttached();
});
test("legacy styles and reset clear new mark-making settings", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  const search = page.getByLabel("Search all 300 styles");
  await search.fill("Ink Contour");
  await page.getByRole("button", { name: "Ink Contour", exact: true }).click();
  await expect(page.getByLabel("Mark making", { exact: true })).toHaveValue(
    "contour",
  );
  await search.fill("Matrix Rain");
  await page.getByRole("button", { name: "Matrix Rain", exact: true }).click();
  await expect(page.getByLabel("Mark making", { exact: true })).toHaveValue(
    "classic",
  );
  await search.fill("Ink Contour");
  await page.getByRole("button", { name: "Ink Contour", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset settings", exact: true })
    .click();
  await expect(page.getByLabel("Mark making", { exact: true })).toHaveValue(
    "classic",
  );
});

test("button hover backgrounds stay blue or neutral in both themes", async ({
  page,
}) => {
  await page.goto("/");
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
      await page
        .getByRole("button", { name: "Switch theme", exact: true })
        .click();
    for (const selector of [
      ".header-create",
      ".dimension-actions .primary",
      ".dimension-actions .ghost",
      ".workspace-copy .secondary",
    ]) {
      const button = page.locator(selector);
      await button.hover();
      await page.waitForTimeout(250);
      const color = await button.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      const rgb = color.match(/[\d.]+/g)!.map(Number);
      expect(
        rgb[1] > rgb[0] + 25 && rgb[1] > rgb[2] + 25 && rgb[1] > 150,
        `${theme}/${selector}: ${color}`,
      ).toBe(false);
    }
  }
});
test("art treatments survive custom style validation and create different geometries", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  const result = await page.evaluate(async () => {
    const enginePath = "/src/studio/engine.ts",
      presetsPath = "/src/constants/presets.ts",
      storagePath = "/src/studio/storage.ts",
      typesPath = "/src/studio/types.ts";
    const { buildArtwork, loadImage } = await import(enginePath);
    const { PRESETS } = await import(presetsPath);
    const { validateOptions } = await import(storagePath);
    const { DEFAULTS } = await import(typesPath);
    const image = await loadImage("/samples/portrait.jpg");
    const seen = new Set();
    const signatures = [];
    let preserved = true;
    for (const p of PRESETS.slice(0, 148)) {
      if (seen.has(p.options.treatment)) continue;
      seen.add(p.options.treatment);
      const options = validateOptions({
        ...DEFAULTS,
        ...p.options,
        resolution: 36,
      });
      preserved &&=
        options.treatment === p.options.treatment &&
        JSON.stringify(options.palette) === JSON.stringify(p.options.palette);
      const art = await buildArtwork(image, image.width, image.height, options);
      signatures.push(
        JSON.stringify(
          art.cells
            .map((c: any) => [c.x, c.y, c.shape, c.size, c.angle, c.char])
            .slice(0, 80),
        ),
      );
    }
    return {
      preserved,
      methods: seen.size,
      geometries: new Set(signatures).size,
    };
  });
  expect(result.preserved).toBe(true);
  expect(result.methods).toBe(17);
  expect(result.geometries).toBe(17);
});
