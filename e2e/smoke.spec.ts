import { expect, test } from "@playwright/test";
import {
  GAME_SAVE_KEY,
  GAME_SAVE_RECOVERY_KEY,
} from "../src/persistence/gameStorage";
import { OFFLINE_PROGRESS_CONFIG } from "../src/game/offlineProgress";
import { CURRENT_SAVE_VERSION } from "../src/game/state";

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

test("caps legacy offline gathering and does not award the cap twice", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible();

  await page.evaluate((maxElapsedMs) => {
    localStorage.removeItem("idlegame.save");
    localStorage.removeItem("idlegame.save.recovery");
    localStorage.setItem("active_skill", "woodcutting");
    localStorage.setItem(
      "active_skill_start",
      String(Date.now() - maxElapsedMs - 60_000)
    );
    localStorage.setItem("selected_tree", "tree");
  }, OFFLINE_PROGRESS_CONFIG.gatheringMaxElapsedMs);
  await page.reload();

  const capSummaries = page.getByText(
    "+11520 Tree (offline; 8h cap applied)"
  );
  expect(await capSummaries.count()).toBeGreaterThan(0);
  await expect(capSummaries.first()).toBeVisible();
  const firstTotal = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    return save.state.wcLogs;
  });
  expect(firstTotal).toBe(11_520);

  await page.reload();
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
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Refined Technique · 3 Mastery remaining"
  );
  await expect(core.getByTestId("practice-strength")).toHaveText(
    "Manual Practice: +25 progress per press"
  );
  await expect(
    core.getByRole("progressbar", { name: "Training level progress" })
  ).toHaveAttribute("aria-valuenow", "0");
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
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Refined Technique · 2 Mastery remaining"
  );
  await expect(page.getByRole("status")).toContainText(
    "+1 Mastery · +25 Training XP"
  );
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
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Steady Routine · 8 Mastery remaining"
  );
  await expect(core.getByTestId("practice-strength")).toHaveText(
    "Manual Practice: +40 progress per press"
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
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Automation active · Manual Practice remains available"
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

test("completes the critical playable-core journey from a fresh save", async ({
  page,
}) => {
  await page.getByRole("link", { name: "Character" }).click();
  const characterCard = page.getByTestId("character-card");
  const characterName = page.getByLabel("Character name");
  await expect(characterCard.getByTestId("character-name")).toHaveText(
    "Trainee"
  );
  await expect(characterCard.getByTestId("character-stage")).toHaveText(
    "Training in progress"
  );
  await characterName.fill("  Mira   Stone  ");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Character name saved as Mira Stone."
  );
  await expect(characterCard.getByTestId("character-name")).toHaveText(
    "Mira Stone"
  );

  await page.reload();
  await expect(characterCard.getByTestId("character-name")).toHaveText(
    "Mira Stone"
  );
  await page.getByRole("link", { name: "Home" }).click();

  const core = page.getByTestId("playable-core");
  const cycleProgress = core.getByRole("progressbar", {
    name: "Practice cycle progress",
  });
  const basePractice = core.getByRole("button", {
    name: "Practice +25 progress",
  });
  const firstTrial = core.getByTestId("first-trial");
  const firstTrialReadiness = firstTrial.getByRole("progressbar", {
    name: "First Trial readiness",
  });

  await expect(core.getByTestId("core-guidance")).toContainText(
    "Refined Technique · 3 Mastery remaining"
  );
  await expect(firstTrial.getByTestId("first-trial-status")).toHaveText(
    "Locked"
  );
  await expect(firstTrial).toContainText("Training Level 1 of 3");
  await expect(firstTrial).toContainText("0 / 400 Training XP");
  await expect(firstTrialReadiness).toHaveAttribute("aria-valuenow", "0");
  await expect(
    firstTrial.getByRole("button", { name: "Reach Training Level 3" })
  ).toBeDisabled();

  for (let action = 0; action < 4; action += 1) {
    await basePractice.click();
  }
  await expect(core.getByTestId("core-mastery")).toHaveText("1");
  await expect(core.getByTestId("core-training-xp")).toHaveText("25");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("1");

  for (let action = 0; action < 8; action += 1) {
    await basePractice.click();
  }
  await expect(core.getByTestId("core-mastery")).toHaveText("3");

  await core.getByRole("button", { name: "Buy for 3 Mastery" }).click();
  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );
  await expect(core.getByTestId("practice-strength")).toHaveText(
    "Manual Practice: +40 progress per press"
  );
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Steady Routine · 8 Mastery remaining"
  );

  const upgradedPractice = core.getByRole("button", {
    name: "Practice +40 progress",
  });
  for (let action = 0; action < 20; action += 1) {
    await upgradedPractice.click();
  }
  await expect(core.getByTestId("core-mastery")).toHaveText("8");
  await expect(core.getByTestId("core-training-xp")).toHaveText("275");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("11");

  await core
    .getByRole("button", { name: "Unlock for 8 Mastery" })
    .click();
  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Automation active · Manual Practice remains available"
  );
  await expect(cycleProgress).not.toHaveAttribute("aria-valuenow", "0");

  const progressBeforeManual = Number(
    await cycleProgress.getAttribute("aria-valuenow")
  );
  const cyclesBeforeManual = Number(
    await core.getByTestId("core-completed-cycles").innerText()
  );
  await upgradedPractice.click();
  const progressAfterManual = Number(
    await cycleProgress.getAttribute("aria-valuenow")
  );
  const cyclesAfterManual = Number(
    await core.getByTestId("core-completed-cycles").innerText()
  );
  expect(
    (cyclesAfterManual - cyclesBeforeManual) * 100 +
      progressAfterManual -
      progressBeforeManual
  ).toBeGreaterThanOrEqual(40);

  await expect(firstTrial.getByTestId("first-trial-status")).toHaveText(
    "Locked"
  );
  for (let action = 0; action < 20; action += 1) {
    const trainingXp = Number(
      await core.getByTestId("core-training-xp").innerText()
    );
    if (trainingXp >= 400) break;
    await upgradedPractice.click();
  }

  expect(
    Number(await core.getByTestId("core-training-xp").innerText())
  ).toBeGreaterThanOrEqual(400);
  await expect(firstTrial.getByTestId("first-trial-status")).toHaveText(
    "Ready"
  );
  await expect(firstTrialReadiness).toHaveAttribute("aria-valuenow", "400");
  const attempt = firstTrial.getByRole("button", {
    name: "Attempt First Trial",
  });
  await expect(attempt).toBeEnabled();

  const masteryBeforeTrial = Number(
    await core.getByTestId("core-mastery").innerText()
  );
  const trainingXpBeforeTrial = Number(
    await core.getByTestId("core-training-xp").innerText()
  );
  await attempt.click();

  await expect(firstTrial.getByTestId("first-trial-status")).toHaveText(
    "Trial Completed"
  );
  await expect(firstTrial).toContainText("Reach Training Level 4");
  await expect(firstTrial).toContainText(
    "No further trial or reward is promised yet."
  );
  await expect(
    firstTrial.getByRole("button", { name: "Attempt First Trial" })
  ).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText(
    "First Trial completed · Your training enabled this milestone"
  );
  expect(
    Number(await core.getByTestId("core-mastery").innerText())
  ).toBeGreaterThanOrEqual(masteryBeforeTrial);
  expect(
    Number(await core.getByTestId("core-training-xp").innerText())
  ).toBeGreaterThanOrEqual(trainingXpBeforeTrial);
  await expect(upgradedPractice).toBeVisible();

  await page.reload();

  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );
  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(core.getByTestId("core-guidance")).toContainText(
    "Automation active · Manual Practice remains available"
  );
  await expect(
    core.getByRole("button", { name: "Practice +40 progress" })
  ).toBeVisible();
  await expect(firstTrial.getByTestId("first-trial-status")).toHaveText(
    "Trial Completed"
  );
  await expect(firstTrial).toContainText("Reach Training Level 4");
  expect(
    Number(await core.getByTestId("core-training-xp").innerText())
  ).toBeGreaterThanOrEqual(275);
  expect(
    Number(await core.getByTestId("core-completed-cycles").innerText())
  ).toBeGreaterThanOrEqual(11);

  await page.getByRole("link", { name: "Character" }).click();
  await expect(characterCard.getByTestId("character-name")).toHaveText(
    "Mira Stone"
  );
  await expect(characterCard.getByTestId("character-stage")).toHaveText(
    "Trial proven"
  );
  await expect(characterCard.getByTestId("character-milestone")).toContainText(
    "First Trial completed"
  );
  await expect(characterCard.getByTestId("character-milestone")).toContainText(
    "Reach Training Level 4"
  );
});

test("exposes keyboard activity controls and labelled progress", async ({
  page,
}) => {
  await expect(
    page.getByRole("progressbar", { name: "Training level progress" })
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Woodcutting level progress" })
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Mining level progress" })
  ).toBeVisible();

  const startWoodcutting = page.getByRole("button", {
    name: "Start Woodcutting",
  });
  await startWoodcutting.focus();
  await startWoodcutting.press("Enter");
  const stopWoodcutting = page.getByRole("button", {
    name: "Stop Woodcutting",
  });
  await expect(stopWoodcutting).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("progressbar", { name: "Woodcutting action progress" })
  ).toBeVisible();

  await stopWoodcutting.press("Space");
  await expect(startWoodcutting).toHaveAttribute("aria-pressed", "false");

  const startMining = page.getByRole("button", { name: "Start Mining" });
  await startMining.focus();
  await startMining.press("Enter");
  await expect(
    page.getByRole("button", { name: "Stop Mining" })
  ).toHaveAttribute("aria-pressed", "true");
});

test("keeps the dashboard within a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.reload();

  await expect(page.getByTestId("playable-core")).toBeVisible();
  await expect(page.getByTestId("first-trial")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);

  await page.getByRole("link", { name: "Character" }).click();
  await expect(page.getByTestId("character-card")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
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
    version: CURRENT_SAVE_VERSION,
    wcXp: 100,
    gold: 42,
    legacyXp: "100",
  });
});

test("wipes a progressed save while game loops are active", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    save.state.wcXp = 200;
    save.state.wcLogs = 3;
    save.state.gold = 42;
    save.state.inventory.tree = 3;
    save.state.tools.bronzeAxe = true;
    save.state.playableCore.mastery = 5;
    save.state.playableCore.trainingXp = 300;
    save.state.playableCore.completedCycles = 12;
    save.state.playableCore.cycleProgress = 0;
    save.state.playableCore.refinedTechniqueOwned = true;
    save.state.playableCore.steadyRoutineOwned = true;
    save.activeActivity = {
      skill: "woodcutting",
      resourceId: "tree",
      startedAt: Date.now(),
    };
    localStorage.setItem("idlegame.save", JSON.stringify(save));
    localStorage.setItem("unrelated.application", "keep-me");
  });
  await page.reload();

  const core = page.getByTestId("playable-core");
  await expect(core.getByTestId("refined-technique-owned")).toHaveText(
    "Owned"
  );
  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).not.toHaveAttribute("aria-valuenow", "0");
  await expect(
    page.getByRole("button", { name: "Stop Woodcutting" })
  ).toBeVisible();

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Wipe Save" }).click();

  await expect(core.getByTestId("steady-routine-owned")).toHaveText(
    "Running"
  );
  await expect(
    page.getByRole("button", { name: "Stop Woodcutting" })
  ).toBeVisible();
  const canceledSave = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("idlegame.save")!);
    return {
      gold: save.state.gold,
      steadyRoutineOwned: save.state.playableCore.steadyRoutineOwned,
      activeSkill: save.activeActivity?.skill,
    };
  });
  expect(canceledSave).toEqual({
    gold: 42,
    steadyRoutineOwned: true,
    activeSkill: "woodcutting",
  });

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Wipe Save" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(core.getByTestId("core-mastery")).toHaveText("0");
  await expect(core.getByTestId("core-training-xp")).toHaveText("0");
  await expect(core.getByTestId("core-completed-cycles")).toHaveText("0");
  await expect(
    core.getByRole("progressbar", { name: "Practice cycle progress" })
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(
    core.getByRole("button", { name: "Needs 3 Mastery" })
  ).toBeDisabled();
  await expect(
    core.getByRole("button", { name: "Requires Refined Technique" })
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Start Woodcutting" })
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("idlegame.save") !== null)
    )
    .toBe(true);

  const storage = await page.evaluate(() => ({
    unrelated: localStorage.getItem("unrelated.application"),
    legacyXp: localStorage.getItem("wc_xp"),
    recovery: localStorage.getItem("idlegame.save.recovery"),
    save: JSON.parse(localStorage.getItem("idlegame.save")!),
  }));
  expect(storage).toEqual({
    unrelated: "keep-me",
    legacyXp: null,
    recovery: null,
    save: {
      version: CURRENT_SAVE_VERSION,
      state: {
        character: { name: "Trainee" },
        wcXp: 0,
        wcLogs: 0,
        miningXp: 0,
        miningOres: 0,
        gold: 0,
        tools: {
          bronzeAxe: false,
          ironAxe: false,
          bronzePickaxe: false,
          ironPickaxe: false,
        },
        inventory: {},
        playableCore: {
          mastery: 0,
          trainingXp: 0,
          completedCycles: 0,
          cycleProgress: 0,
          refinedTechniqueOwned: false,
          steadyRoutineOwned: false,
          firstTrialCompleted: false,
        },
      },
      selections: {
        woodcutting: "tree",
        mining: "rock",
      },
      activeActivity: null,
    },
  });

  await page.reload();
  await expect(core.getByTestId("core-mastery")).toHaveText("0");
  await expect(core.getByTestId("core-training-xp")).toHaveText("0");
  await expect(
    page.getByRole("button", { name: "Start Woodcutting" })
  ).toBeVisible();
});
