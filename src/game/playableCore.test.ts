import { describe, expect, it } from "vitest";
import {
  PLAYABLE_CORE_CONFIG,
  applyPlayableCoreProgress,
  performPractice,
  purchaseRefinedTechnique,
} from "./playableCore";
import { createDefaultGameState } from "./state";

describe("playable-core progress", () => {
  it("adds the configured progress for one Practice action", () => {
    const state = createDefaultGameState();
    const result = performPractice(state);

    expect(result.completedCycles).toBe(0);
    expect(result.state.playableCore.cycleProgress).toBe(25);
    expect(result.state.playableCore.mastery).toBe(0);
    expect(result.state.playableCore.trainingXp).toBe(0);
    expect(state.playableCore.cycleProgress).toBe(0);
  });

  it("awards one exact completed cycle after four fresh actions", () => {
    let state = createDefaultGameState();

    for (let action = 0; action < 4; action += 1) {
      state = performPractice(state).state;
    }

    expect(state.playableCore).toEqual({
      mastery: 1,
      trainingXp: 25,
      completedCycles: 1,
      cycleProgress: 0,
      refinedTechniqueOwned: false,
    });
  });

  it("retains overflow progress after a completion", () => {
    const state = createDefaultGameState();
    const result = applyPlayableCoreProgress(state, 125);

    expect(result.completedCycles).toBe(1);
    expect(result.state.playableCore.cycleProgress).toBe(25);
    expect(result.state.playableCore.mastery).toBe(1);
  });

  it("awards multiple completions deterministically", () => {
    const state = createDefaultGameState();
    const result = applyPlayableCoreProgress(state, 250);

    expect(result.completedCycles).toBe(2);
    expect(result.state.playableCore).toEqual({
      mastery: 2,
      trainingXp: 50,
      completedCycles: 2,
      cycleProgress: 50,
      refinedTechniqueOwned: false,
    });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid progress %s",
    (progressAmount) => {
      const state = createDefaultGameState();
      const result = applyPlayableCoreProgress(state, progressAmount);

      expect(result).toEqual({ state, completedCycles: 0 });
      expect(result.state).toBe(state);
    }
  );

  it("rejects invalid existing cycle progress", () => {
    const state = createDefaultGameState();
    state.playableCore.cycleProgress =
      PLAYABLE_CORE_CONFIG.cycleProgressRequired;

    expect(performPractice(state)).toEqual({ state, completedCycles: 0 });
  });

  it("does not mutate nested input state", () => {
    const state = createDefaultGameState();
    const originalCore = state.playableCore;
    const result = performPractice(state);

    expect(result.state).not.toBe(state);
    expect(result.state.playableCore).not.toBe(originalCore);
    expect(originalCore).toEqual({
      mastery: 0,
      trainingXp: 0,
      completedCycles: 0,
      cycleProgress: 0,
      refinedTechniqueOwned: false,
    });
  });
});

describe("Refined Technique", () => {
  it("purchases once and preserves lifetime progression", () => {
    const state = createDefaultGameState();
    state.playableCore = {
      mastery: 3,
      trainingXp: 75,
      completedCycles: 3,
      cycleProgress: 0,
      refinedTechniqueOwned: false,
    };

    const result = purchaseRefinedTechnique(state);

    expect(result.purchased).toBe(true);
    expect(result.state.playableCore).toEqual({
      mastery: 0,
      trainingXp: 75,
      completedCycles: 3,
      cycleProgress: 0,
      refinedTechniqueOwned: true,
    });
    expect(state.playableCore.mastery).toBe(3);
    expect(state.playableCore.refinedTechniqueOwned).toBe(false);
  });

  it("rejects insufficient Mastery and duplicate ownership", () => {
    const insufficient = createDefaultGameState();
    insufficient.playableCore.mastery = 2;
    expect(purchaseRefinedTechnique(insufficient)).toEqual({
      state: insufficient,
      purchased: false,
    });

    const owned = createDefaultGameState();
    owned.playableCore.mastery = 6;
    owned.playableCore.refinedTechniqueOwned = true;
    expect(purchaseRefinedTechnique(owned)).toEqual({
      state: owned,
      purchased: false,
    });
  });

  it("raises Practice to 40 progress and retains overflow", () => {
    let state = createDefaultGameState();
    state.playableCore.refinedTechniqueOwned = true;

    state = performPractice(state).state;
    expect(state.playableCore.cycleProgress).toBe(40);

    state = performPractice(state).state;
    state = performPractice(state).state;

    expect(state.playableCore.mastery).toBe(1);
    expect(state.playableCore.trainingXp).toBe(25);
    expect(state.playableCore.completedCycles).toBe(1);
    expect(state.playableCore.cycleProgress).toBe(20);
  });
});
