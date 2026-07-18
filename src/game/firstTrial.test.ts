import { describe, expect, it } from "vitest";
import {
  FIRST_TRIAL_CONFIG,
  FIRST_TRIAL_IDS,
  attemptFirstTrial,
  getFirstTrialStatus,
} from "./firstTrial";
import { createDefaultGameState } from "./state";

describe("First Trial status", () => {
  it("centralizes stable IDs and derives the Level 3 XP requirement", () => {
    expect(FIRST_TRIAL_IDS).toEqual({
      capability: "training_level",
      objective: "first_trial",
      completion: "first_trial_completed",
      followUpObjective: "reach_training_level_4",
    });
    expect(FIRST_TRIAL_CONFIG).toEqual({
      requiredTrainingLevel: 3,
      requiredTrainingXp: 400,
      followUpTrainingLevel: 4,
    });
  });

  it("is locked immediately below the requirement", () => {
    const state = createDefaultGameState();
    state.playableCore.trainingXp = 399;

    expect(getFirstTrialStatus(state)).toEqual({
      stage: "locked",
      trainingLevel: 2,
      requiredTrainingLevel: 3,
      trainingXp: 399,
      requiredTrainingXp: 400,
    });
  });

  it("is ready at the exact requirement", () => {
    const state = createDefaultGameState();
    state.playableCore.trainingXp = 400;

    expect(getFirstTrialStatus(state)).toEqual({
      stage: "ready",
      trainingLevel: 3,
      requiredTrainingLevel: 3,
      trainingXp: 400,
      requiredTrainingXp: 400,
    });
  });

  it("remains ready above the requirement until completed", () => {
    const state = createDefaultGameState();
    state.playableCore.trainingXp = 625;

    expect(getFirstTrialStatus(state).stage).toBe("ready");
  });

  it("remains completed after further progression", () => {
    const state = createDefaultGameState();
    state.playableCore.trainingXp = 900;
    state.playableCore.firstTrialCompleted = true;

    expect(getFirstTrialStatus(state)).toMatchObject({
      stage: "completed",
      trainingLevel: 4,
      trainingXp: 900,
    });
  });
});

describe("First Trial attempt", () => {
  it("completes once without spending or awarding anything else", () => {
    const state = createDefaultGameState();
    state.playableCore.trainingXp = 400;
    state.playableCore.mastery = 9;
    state.playableCore.completedCycles = 16;
    state.gold = 42;
    state.inventory.tree = 3;

    const result = attemptFirstTrial(state);

    expect(result.completed).toBe(true);
    expect(result.state).not.toBe(state);
    expect(result.state.playableCore).not.toBe(state.playableCore);
    expect(result.state).toEqual({
      ...state,
      playableCore: {
        ...state.playableCore,
        firstTrialCompleted: true,
      },
    });
    expect(state.playableCore.firstTrialCompleted).toBe(false);
  });

  it("rejects locked, repeated, and invalid attempts unchanged", () => {
    const locked = createDefaultGameState();
    locked.playableCore.trainingXp = 399;
    expect(attemptFirstTrial(locked)).toEqual({
      state: locked,
      completed: false,
    });

    const completed = createDefaultGameState();
    completed.playableCore.trainingXp = 400;
    completed.playableCore.firstTrialCompleted = true;
    expect(attemptFirstTrial(completed)).toEqual({
      state: completed,
      completed: false,
    });

    const invalid = createDefaultGameState();
    Object.assign(invalid.playableCore, { firstTrialCompleted: "yes" });
    expect(attemptFirstTrial(invalid)).toEqual({
      state: invalid,
      completed: false,
    });
  });
});
