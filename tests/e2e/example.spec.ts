import { test, expect } from "@playwright/test";

test.describe("basic example test", () => {
  test("has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Verfahrensplattform");
  });

  test("shows hello message", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Hello Verfahrensplattform!")).toBeVisible();
  });
});
