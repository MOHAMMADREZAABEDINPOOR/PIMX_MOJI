import { expect, type Page } from "@playwright/test";
export async function previewCurrent(page: Page) {
  if (await page.getByLabel("Style preview", { exact: true }).isVisible()) return;
  await page.getByRole("button", { name: "Preview selection", exact: true }).click();
  await expect(page.getByLabel("Style preview", { exact: true })).toBeVisible();
  await expect(page.locator(".render-indicator")).toHaveCount(0);
}
export async function openEditorTools(page: Page) {
  await expect(page.getByRole("button", { name: "Generate artwork", exact: true })).toBeEnabled({ timeout: 15000 });
  for (const selector of [".source-import-tools", ".studio-history", "#control-style", "#control-adjust", "#control-brush"]) {
    const details = page.locator(selector);
    if (!(await details.getAttribute("open"))) {
      if (!(await details.evaluate((e: HTMLDetailsElement) => e.open))) {
        await details.locator(":scope > summary").evaluate((e) => e.scrollIntoView({block: "center", behavior: "instant"}));
        await details.locator(":scope > summary").click();
      }
    }
  }
  await previewCurrent(page);
}
