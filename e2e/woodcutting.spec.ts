import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("woodcutting page loads and shows the heading", async ({ page }) => {
  await page.goto("/woodcutting");

  await expect(page.getByRole("heading", { name: "Woodcutting" })).toBeVisible();
  await expect(page.getByText("Choose a tree")).toBeVisible();
});

test("all three trees are shown as selectable buttons", async ({ page }) => {
  await page.goto("/woodcutting");

  await expect(page.getByRole("button", { name: /tree/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /oak/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /willow/i })).toBeVisible();
});

test("oak and willow are locked without tools", async ({ page }) => {
  await page.goto("/woodcutting");

  await expect(page.getByRole("button", { name: /oak/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /willow/i })).toBeDisabled();
});

test("player can select an unlocked tree", async ({ page }) => {
  await page.goto("/woodcutting");

  const treeButton = page.getByRole("button", { name: /^🌲/i }).or(
    page.locator("button").filter({ hasText: "Tree" }).filter({ hasText: "25 XP" })
  );

  await expect(treeButton).toBeEnabled();
  await treeButton.click();
  await expect(page.getByRole("heading", { name: "Woodcutting" })).toBeVisible();
});

test("navigation works between pages", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /woodcutting/i }).click();
  await expect(page).toHaveURL(/woodcutting/);

  await page.getByRole("link", { name: /mining/i }).click();
  await expect(page).toHaveURL(/mining/);
});
