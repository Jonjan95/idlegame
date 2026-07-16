import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("loads the dashboard and navigates to an activity", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Woodcutting" }).click();

  await expect(page).toHaveURL(/\/woodcutting$/);
  await expect(
    page.getByRole("heading", { name: "Woodcutting" })
  ).toBeVisible();
});
