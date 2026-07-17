import { expect, test } from "@playwright/test";
import {
  GAME_SAVE_KEY,
  GAME_SAVE_RECOVERY_KEY,
} from "../src/persistence/gameStorage";

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
    localStorage.removeItem("idlegame.save");
    localStorage.removeItem("idlegame.save.recovery");
    localStorage.setItem("wc_xp", "19600");
  });
  await page.reload();

  const oak = page.getByRole("button", { name: /Oak/i });

  await expect(oak).toBeDisabled();
  await expect(oak).toContainText("Requires Bronze Axe");

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    save.state.tools.bronzeAxe = true;
    localStorage.setItem("idlegame.save", JSON.stringify(save));
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
    localStorage.removeItem("idlegame.save");
    localStorage.removeItem("idlegame.save.recovery");
    localStorage.setItem("active_skill", "woodcutting");
    localStorage.setItem("active_skill_start", String(Date.now() - 2_600));
    localStorage.setItem("selected_tree", "tree");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  const firstTotal = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    return save.state.wcLogs;
  });
  expect(firstTotal).toBe(1);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  const secondTotal = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    return save.state.wcLogs;
  });
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

test("unlocks Steady Routine and keeps manual Practice", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    save.state.playableCore.mastery = 8;
    save.state.playableCore.trainingXp = 275;
    save.state.playableCore.completedCycles = 11;
    save.state.playableCore.cycleProgress = 0;
    save.state.playableCore.refinedTechniqueOwned = true;
    localStorage.setItem("idlegame.save", JSON.stringify(save));
  });
  await page.reload();

  const core = page.getByTestId("playable-core");
  const progress = core.getByRole("progressbar", {
    name: "Practice cycle progress",
  });

  await core
    .getByRole("button", { name: "Unlock for 8 Mastery" })
    .click();

  await expect(core.getByTestId("core-mastery")).toHaveText("0");
  await expect(core.getByTestId("core-training-xp")).toHaveText("275");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("11");
  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(progress).not.toHaveAttribute("aria-valuenow", "0");

  const beforeManual = Number(await progress.getAttribute("aria-valuenow"));
  await core
    .getByRole("button", { name: "Practice +40 progress" })
    .click();
  const afterManual = Number(await progress.getAttribute("aria-valuenow"));
  expect(afterManual - beforeManual).toBeGreaterThanOrEqual(40);

  await page.reload();

  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(
    core.getByRole("button", { name: "Practice +40 progress" })
  ).toBeVisible();
});

test("migrates a legacy gameplay fixture to the canonical save", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  await page.evaluate(
    ({ saveKey, recoveryKey }) => {
      localStorage.removeItem(saveKey);
      localStorage.removeItem(recoveryKey);
      localStorage.setItem("wc_xp", "100");
      localStorage.setItem("gold", "42");
      localStorage.setItem("playable_core_mastery", "3");
      localStorage.setItem("playable_core_training_xp", "75");
      localStorage.setItem("playable_core_completed_cycles", "3");
      localStorage.setItem("playable_core_cycle_progress", "40.5");
      localStorage.setItem("playable_core_refined_technique", "true");
    },
    { saveKey: GAME_SAVE_KEY, recoveryKey: GAME_SAVE_RECOVERY_KEY }
  );
  await page.reload();

  const core = page.getByTestId("playable-core");
  await expect(core.getByTestId("core-mastery")).toHaveText("3");
  await expect(core.getByTestId("core-training-xp")).toHaveText("75");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("3");
  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "40.5");

  const migrated = await page.evaluate((saveKey) => {
    const save = JSON.parse(localStorage.getItem(saveKey)!);
    return {
      version: save.version,
      wcXp: save.state.wcXp,
      gold: save.state.gold,
      legacyXp: localStorage.getItem("wc_xp"),
    };
  }, GAME_SAVE_KEY);
  expect(migrated).toEqual({
    version: 1,
    wcXp: 100,
    gold: 42,
    legacyXp: "100",
  });
});

test("wipes only IdleGame save data through the dashboard", async ({ page }) => {
  const core = page.getByTestId("playable-core");
  const practice = core.getByRole("button", { name: "Practice +25 progress" });
  await practice.click();
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "25");

  await page.evaluate(() => {
    localStorage.setItem("unrelated.application", "keep-me");
  });

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Wipe Save" }).click();

  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();
  await expect(
    page
      .getByTestId("playable-core")
      .getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "0");

  const storage = await page.evaluate(() => ({
    unrelated: localStorage.getItem("unrelated.application"),
    legacyXp: localStorage.getItem("wc_xp"),
    recovery: localStorage.getItem("idlegame.save.recovery"),
    saveVersion: JSON.parse(localStorage.getItem("idlegame.save")!).version,
  }));
  expect(storage).toEqual({
    unrelated: "keep-me",
    legacyXp: null,
    recovery: null,
    saveVersion: 1,
  });
});
