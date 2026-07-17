import { describe, expect, it } from "vitest";
import {
  CURRENT_SAVE_VERSION,
  createDefaultGameSave,
  createDefaultGameState,
  validateGameSave,
  validateGameState,
} from "./state";

describe("canonical game state", () => {
  it("creates isolated nested defaults", () => {
    const first = createDefaultGameState();
    const second = createDefaultGameState();

    first.inventory.tree = 5;
    first.tools.bronzeAxe = true;
    first.playableCore.mastery = 3;

    expect(second.inventory).toEqual({});
    expect(second.tools.bronzeAxe).toBe(false);
    expect(second.playableCore.mastery).toBe(0);
    expect(first.inventory).not.toBe(second.inventory);
    expect(first.tools).not.toBe(second.tools);
    expect(first.playableCore).not.toBe(second.playableCore);
  });

  it("creates a valid versioned save envelope", () => {
    const save = createDefaultGameSave();

    expect(save.version).toBe(CURRENT_SAVE_VERSION);
    expect(save.activeActivity).toBeNull();
    expect(validateGameSave(save)).toEqual([]);
  });

  it("represents the current persistent state without validation errors", () => {
    const save = createDefaultGameSave();
    save.state.wcXp = 250;
    save.state.wcLogs = 10;
    save.state.miningXp = 100;
    save.state.miningOres = 3;
    save.state.gold = 42;
    save.state.tools.bronzeAxe = true;
    save.state.inventory.tree = 4;
    save.state.playableCore.mastery = 2;
    save.state.playableCore.trainingXp = 75;
    save.state.playableCore.completedCycles = 3;
    save.state.playableCore.cycleProgress = 50;
    save.selections.woodcutting = "oak";
    save.activeActivity = {
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    };

    expect(validateGameSave(save)).toEqual([]);
  });

  it("reports negative, non-finite, and fractional economy values", () => {
    const state = createDefaultGameState();
    state.gold = -1;
    state.wcXp = Number.NaN;
    state.inventory.tree = 1.5;
    state.playableCore.trainingXp = -2;
    state.playableCore.cycleProgress = 100;

    expect(validateGameState(state)).toEqual(
      expect.arrayContaining([
        { path: "state.gold", message: "must not be negative" },
        { path: "state.wcXp", message: "must be finite" },
        {
          path: "state.inventory.tree",
          message: "must be an integer",
        },
        {
          path: "state.playableCore.trainingXp",
          message: "must not be negative",
        },
        {
          path: "state.playableCore.cycleProgress",
          message: "must be less than 100",
        },
      ])
    );
  });

  it("reports invalid identifiers, timestamps, and save versions", () => {
    const save = createDefaultGameSave();
    save.selections.mining = " ";
    save.activeActivity = {
      skill: "mining",
      resourceId: "",
      startedAt: -1,
    };
    Object.assign(save, { version: 999 });
    Object.assign(save.activeActivity, { skill: "unknown" });

    expect(validateGameSave(save)).toEqual(
      expect.arrayContaining([
        { path: "version", message: `must equal ${CURRENT_SAVE_VERSION}` },
        { path: "selections.mining", message: "must not be empty" },
        {
          path: "activeActivity.skill",
          message: "must be a known skill",
        },
        {
          path: "activeActivity.resourceId",
          message: "must not be empty",
        },
        {
          path: "activeActivity.startedAt",
          message: "must not be negative",
        },
      ])
    );
  });
});
