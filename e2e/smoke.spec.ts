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

test("does not duplicate completed production on immediate reload", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("active_skill", "woodcutting");
    localStorage.setItem("active_skill_start", String(Date.now() - 2_600));
    localStorage.setItem("selected_tree", "tree");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  const firstTotal = await page.evaluate(() =>
    Number(localStorage.getItem("wc_logs"))
  );
  expect(firstTotal).toBe(1);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  const secondTotal = await page.evaluate(() =>
    Number(localStorage.getItem("wc_logs"))
  );
  expect(secondTotal).toBe(firstTotal);
});

test("completes and persists the first Practice cycle", async ({ page }) => {
  const core = page.getByTestId("playable-core");
  const practice = core.getByRole("button", {
    name: "Practice +25 progress",
  });

  await expect(core.getByTestId("core-mastery")).toHaveText("0");
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "0");

  await practice.click();
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "25");

  await practice.click();
  await practice.click();
  await practice.click();

  await expect(core.getByTestId("core-mastery")).toHaveText("1");
  await expect(core.getByTestId("core-training-xp")).toHaveText("25");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("1");
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "0");

  await page.reload();

  await expect(core.getByTestId("core-mastery")).toHaveText("1");
  await expect(core.getByTestId("core-training-xp")).toHaveText("25");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("1");
});

test("buys Refined Technique and improves Practice", async ({ page }) => {
  const core = page.getByTestId("playable-core");
  const basePractice = core.getByRole("button", {
    name: "Practice +25 progress",
  });

  await expect(
    core.getByRole("button", { name: "Needs 3 Mastery" })
  ).toBeDisabled();

  for (let action = 0; action < 12; action += 1) {
    await basePractice.click();
  }

  await expect(core.getByTestId("core-mastery")).toHaveText("3");
  await expect(core.getByTestId("core-training-xp")).toHaveText("75");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("3");

  await core.getByRole("button", { name: "Buy for 3 Mastery" }).click();

  await expect(core.getByTestId("core-mastery")).toHaveText("0");
  await expect(core.getByTestId("core-training-xp")).toHaveText("75");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("3");
  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );

  await core
    .getByRole("button", { name: "Practice +40 progress" })
    .click();
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "40");

  await page.reload();

  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );
  await expect(
    core.getByRole("button", { name: "Practice +40 progress" })
  ).toBeVisible();
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "40");
});
