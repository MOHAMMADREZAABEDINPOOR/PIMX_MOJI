import { openEditorTools, previewCurrent } from "./editor-helpers";
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { unzipSync } from "fflate";
test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
  permissions: ["camera"],
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("language", "en");
    localStorage.setItem("theme", "dark");
  });
});
test("brush paints local edits, undo restores output, batch exports real PNGs in ZIP", async ({
  page,
}) => {
  await page.goto("/#studio");
  await openEditorTools(page);
  await expect(
    page.getByRole("button", { name: "Generate artwork", exact: true }),
  ).toBeEnabled();
  const canvas = page.locator('canvas[aria-label="Style preview"]');
  const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page
    .getByRole("checkbox", { name: "Enable brush", exact: true })
    .check();
  await page.getByRole("button", { name: "Erase", exact: true }).click();
  const overlay = page.getByLabel("Paint on the artwork", { exact: true });
  await overlay.scrollIntoViewIfNeeded();
  const rect = await overlay.boundingBox();
  await page.mouse.move(rect!.x + rect!.width * 0.18, rect!.y + rect!.height * 0.18);
  await page.mouse.down();
  await page.mouse.move(
    rect!.x + rect!.width * 0.3,
    rect!.y + rect!.height * 0.3,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(before);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .toBe(before);
  await page.getByRole("button", { name: "Batch image export", exact: true }).click();
  await page
    .getByLabel("Batch images")
    .setInputFiles([
      path.resolve("public/samples/portrait.jpg"),
      path.resolve("public/samples/landscape.jpg"),
    ]);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create & download ZIP" }).click();
  const downloaded = await downloadEvent;
  const files = unzipSync(readFileSync((await downloaded.path())!));
  expect(Object.keys(files)).toHaveLength(2);
  for (const bytes of Object.values(files))
    expect([...bytes.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
});
test("style imports validate options and reduced motion disables automatic animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#styles");
  await page.getByLabel("Import style JSON").setInputFiles({
    name: "custom.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        name: "Imported safety test",
        options: {
          mode: "ascii",
          chars: "TEST",
          resolution: 100000,
          bgColor: "url(javascript:bad)",
          strokes: [{ x: NaN, y: 1 }],
        },
      }),
    ),
  });
  await expect(
    page.getByRole("button", { name: /Aa Imported safety test ASCII/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Aa Imported safety test ASCII/ })
    .click();

  await openEditorTools(page);
  await expect(
    page.getByRole("slider", { name: "Density", exact: true }),
  ).toHaveValue("220");

  await page.getByRole("button", { name: "Generate artwork", exact: true }).click();
  await page.getByRole("button", { name: "Wave", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play preview", exact: true })).toBeVisible();
  const c = page.getByLabel("Export preview");
  const still = await c.evaluate((x: HTMLCanvasElement) => x.toDataURL());
  await page.waitForTimeout(250);
  expect(await c.evaluate((x: HTMLCanvasElement) => x.toDataURL())).toBe(still);
});
test.describe("live media", () => {
  test("camera renders, captures a real frame and releases its media tracks", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(
        navigator.mediaDevices,
      );
      navigator.mediaDevices.getUserMedia = async (c) => {
        const s = await original(c);
        (window as any).__camera = s;
        return s;
      };
    });
    await page.goto("/#studio");
  await openEditorTools(page);
    await page.getByRole("button", { name: "Open live camera", exact: true }).click();
    await page
      .getByRole("button", { name: "Enable camera", exact: true })
      .click();
    const live = page.locator('canvas[aria-label="Live character preview"]');
    await expect
      .poll(() => live.evaluate((c: HTMLCanvasElement) => c.width))
      .toBeGreaterThan(300);
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save art frame" }).click();
    expect((await downloadEvent).suggestedFilename()).toMatch(/\.png$/);
    await page.getByRole("button", { name: "Edit a frame" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).__camera
            .getTracks()
            .every((t: MediaStreamTrack) => t.readyState === "ended"),
        ),
      )
      .toBe(true);
    await expect(
      page.getByRole("button", { name: "Generate artwork", exact: true }),
    ).toBeEnabled();
  });
  test("uploaded video gets rendered and exported as an actual silent clip", async ({
    page,
  }) => {
    await page.goto("/#studio");
  await openEditorTools(page);
    const bytes = await page.evaluate(async () => {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 120;
      const ctx = c.getContext("2d")!;
      const stream = c.captureStream(10);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks: Blob[] = [];
      const done = new Promise<number[]>((resolve) => {
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = async () =>
          resolve([...new Uint8Array(await new Blob(chunks).arrayBuffer())]);
      });
      recorder.start();
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `hsl(${i * 25},90%,50%)`;
        ctx.fillRect(0, 0, 160, 120);
        ctx.fillStyle = "white";
        ctx.fillRect(i * 10, 20, 25, 50);
        await new Promise((r) => setTimeout(r, 100));
      }
      recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
      return done;
    });
    await page.getByRole("button", { name: "Transform a video", exact: true }).click();
    await page.getByLabel("Choose source video").setInputFiles({
      name: "test.webm",
      mimeType: "video/webm",
      buffer: Buffer.from(bytes),
    });
    await expect(
      page.getByRole("button", { name: "Export video", exact: true }),
    ).toBeEnabled();
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export video", exact: true })
      .click();
    const movie = await downloadEvent;
    expect(readFileSync((await movie.path())!).length).toBeGreaterThan(500);
  });
});
