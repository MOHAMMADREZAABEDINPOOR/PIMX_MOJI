import { openEditorTools, previewCurrent } from "./editor-helpers";
import { test, expect } from "@playwright/test";
import { PRESETS } from "../src/constants/presets";

const imageSignature = (canvas: HTMLCanvasElement) => {
  const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let hash = 2166136261;
  for (const byte of pixels) hash = Math.imul(hash ^ byte, 16777619);
  return `${canvas.width}:${canvas.height}:${hash}`;
};

test("catalog has 300 distinct styles and the new collections have distinct recipes", () => {
  expect(PRESETS).toHaveLength(300);
  expect(new Set(PRESETS.map((p) => p.id)).size).toBe(300);
  expect(new Set(PRESETS.map((p) => p.name)).size).toBe(300);
  const added = PRESETS.slice(0, 148);
  expect(new Set(added.map((p) => JSON.stringify(p.options))).size).toBe(148);
  expect(new Set(added.map((p) => p.options.mode))).toEqual(
    new Set(["ascii", "mosaic", "emoji"]),
  );
});

test("all settings stay on one page and style search applies to the live artwork", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
  await page.goto("/#studio");
  await openEditorTools(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".settings-section")).toHaveCount(4);
  for (const label of [
    "Density",
    "Character spacing",
    "Brightness",
    "Contrast",
    "Saturation",
    "Glow",
    "Brush size",
  ])
    await expect(
      page.getByRole("slider", { name: label, exact: true }),
    ).toBeAttached();
  const before = await page
    .getByLabel("Style preview", { exact: true })
    .evaluate(imageSignature);
  await page.getByLabel("Search all 300 styles").fill("Moon Emoji Collage");
  await expect(page.locator(".preset-swatch-grid .preset-select")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Moon Emoji Collage", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  await previewCurrent(page);
  await expect
    .poll(() =>
      page
        .getByLabel("Style preview", { exact: true })
        .evaluate(imageSignature),
    )
    .not.toBe(before);
  await expect(page).toHaveURL(/#studio$/);
  await expect(page.locator("textarea")).toHaveValue("🌑🌒🌓🌔🌕");
});

test("home defers offscreen previews and its controls change actual artwork", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
  await page.goto("/");
  const hero = page.locator(".dimension-portrait canvas");
  await expect(hero).toHaveAttribute("data-preview-state", "ready");
  expect(
    await page.locator('canvas[data-preview-state="ready"]').count(),
  ).toBeLessThan(4);
  const before = await hero.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.getByRole("button", { name: "Ww Words", exact: true }).click();
  await expect
    .poll(() => hero.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(before);
  await page.getByRole("button", { name: "See original", exact: true }).click();
  await expect(page.locator(".dimension-portrait img")).toHaveClass(
    "show-original",
  );
  await page.getByRole("button", { name: "Pause scene animation" }).click();
  await expect(page.locator(".dimension-scene")).toHaveClass(/motion-paused/);
  await page.locator(".signal-board").scrollIntoViewIfNeeded();
  await expect(page.locator(".signal-board canvas").first()).toHaveAttribute(
    "data-preview-state",
    "ready",
  );
});

test("300px to ultrawide layouts preserve controls in Persian and English, in both themes", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [300, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ["fa", "en"]) {
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem("language", language);
          localStorage.setItem("theme", theme);
        },
        { language, theme: language === "fa" ? "dark" : "light" },
      );
      for (const route of ["home", "studio", "styles", "library"]) {
        await page.goto(`/#${route}`);
        await expect(page.locator(`.page-${route}`)).toBeVisible();
        if (route === "studio")
          await expect(page.locator(".control-panel")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width}/${language}/${route}`,
        ).toBe(true);
        const escapedControls = await page
          .locator(
            'main input:not([type="file"]):not(.sr-only), main textarea, main select',
          )
          .evaluateAll(
            (elements) =>
              elements.filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
              }).length,
          );
        expect(escapedControls, `${width}/${language}/${route} controls`).toBe(
          0,
        );
      }
    }
  }
  expect(errors).toEqual([]);
});
