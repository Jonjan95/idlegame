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

test("shows the provisional level gate for a later resource", async ({
  page,
}) => {
  await page.goto("/woodcutting");

  const oak = page.getByRole("button", { name: /Oak/i });

  await expect(oak).toBeDisabled();
  await expect(oak).toContainText("Requires level 15");
});

test("transitions from level lock to tool lock to unlocked", async ({
  page,
}) => {
  await page.goto("/woodcutting");
  await expect(page.getByText(/Level 1/)).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("wc_xp", "19600");
  });
  await page.reload();

  const oak = page.getByRole("button", { name: /Oak/i });

  await expect(oak).toBeDisabled();
  await expect(oak).toContainText("Requires Bronze Axe");

  await page.evaluate(() => {
    localStorage.setItem(
      "tools",
      JSON.stringify({
        bronzeAxe: true,
        ironAxe: false,
        bronzePickaxe: false,
        ironPickaxe: false,
      })
    );
  });
  await page.reload();

  await expect(page.getByRole("button", { name: /Oak/i })).toBeEnabled();
});
