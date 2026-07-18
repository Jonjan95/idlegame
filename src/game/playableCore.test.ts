import { describe, expect, it } from "vitest";
import {
  PLAYABLE_CORE_CONFIG,
  applySteadyRoutineElapsed,
  applyPlayableCoreProgress,
  performPractice,
  getPlayableCoreGuidance,
  purchaseRefinedTechnique,
  purchaseSteadyRoutine,
} from "./playableCore";
import { createDefaultGameState } from "./state";

describe("playable-core guidance", () => {
  it("points a fresh save to Refined Technique", () => {
    expect(getPlayableCoreGuidance(createDefaultGameState())).toEqual({
      stage: "refined_technique",
      masteryRemaining: 3,
    });
  });

  it("counts down remaining Mastery without going negative", () => {
    const state = createDefaultGameState();
    state.playableCore.mastery = 2;
    expect(getPlayableCoreGuidance(state).masteryRemaining).toBe(1);

    state.playableCore.mastery = 5;
    expect(getPlayableCoreGuidance(state).masteryRemaining).toBe(0);
  });

  it("points to Steady Routine after the technique is owned", () => {
    const state = createDefaultGameState();
    state.playableCore.refinedTechniqueOwned = true;
    state.playableCore.mastery = 3;

    expect(getPlayableCoreGuidance(state)).toEqual({
      stage: "steady_routine",
      masteryRemaining: 5,
    });
  });

  it("reports active automation after both unlocks", () => {
    const state = createDefaultGameState();
    state.playableCore.refinedTechniqueOwned = true;
    state.playableCore.steadyRoutineOwned = true;

    expect(getPlayableCoreGuidance(state)).toEqual({
      stage: "automation_active",
      masteryRemaining: 0,
    });
  });
});

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
      steadyRoutineOwned: false,
      firstTrialCompleted: false,
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
      steadyRoutineOwned: false,
      firstTrialCompleted: false,
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
      steadyRoutineOwned: false,
      firstTrialCompleted: false,
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
      steadyRoutineOwned: false,
      firstTrialCompleted: false,
    };

    const result = purchaseRefinedTechnique(state);

    expect(result.purchased).toBe(true);
    expect(result.state.playableCore).toEqual({
      mastery: 0,
      trainingXp: 75,
      completedCycles: 3,
      cycleProgress: 0,
      refinedTechniqueOwned: true,
      steadyRoutineOwned: false,
      firstTrialCompleted: false,
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

describe("Steady Routine", () => {
  function automationReadyState() {
    const state = createDefaultGameState();
    state.playableCore.mastery = 8;
    state.playableCore.refinedTechniqueOwned = true;
    return state;
  }

  it("requires Refined Technique and enough Mastery", () => {
    const missingTechnique = createDefaultGameState();
    missingTechnique.playableCore.mastery = 8;
    expect(purchaseSteadyRoutine(missingTechnique)).toEqual({
      state: missingTechnique,
      purchased: false,
    });

    const insufficient = automationReadyState();
    insufficient.playableCore.mastery = 7;
    expect(purchaseSteadyRoutine(insufficient)).toEqual({
      state: insufficient,
      purchased: false,
    });
  });

  it("purchases once without changing lifetime progression", () => {
    const state = automationReadyState();
    state.playableCore.trainingXp = 275;
    state.playableCore.completedCycles = 11;

    const result = purchaseSteadyRoutine(state);

    expect(result.purchased).toBe(true);
    expect(result.state.playableCore).toEqual({
      mastery: 0,
      trainingXp: 275,
      completedCycles: 11,
      cycleProgress: 0,
      refinedTechniqueOwned: true,
      steadyRoutineOwned: true,
      firstTrialCompleted: false,
    });
    expect(purchaseSteadyRoutine(result.state)).toEqual({
      state: result.state,
      purchased: false,
    });
  });

  it("adds exactly 20 progress for one elapsed second", () => {
    const state = automationReadyState();
    state.playableCore.steadyRoutineOwned = true;

    const result = applySteadyRoutineElapsed(state, 1000);

    expect(result.completedCycles).toBe(0);
    expect(result.state.playableCore.cycleProgress).toBe(20);
  });

  it("completes and rewards one cycle after five seconds", () => {
    const state = automationReadyState();
    state.playableCore.mastery = 0;
    state.playableCore.steadyRoutineOwned = true;

    const result = applySteadyRoutineElapsed(state, 5000);

    expect(result.completedCycles).toBe(1);
    expect(result.state.playableCore.mastery).toBe(1);
    expect(result.state.playableCore.trainingXp).toBe(25);
    expect(result.state.playableCore.completedCycles).toBe(1);
    expect(result.state.playableCore.cycleProgress).toBe(0);
  });

  it("is invariant across elapsed-time subdivisions", () => {
    const once = automationReadyState();
    once.playableCore.steadyRoutineOwned = true;
    const singleResult = applySteadyRoutineElapsed(once, 2750).state;

    let divided = automationReadyState();
    divided.playableCore.steadyRoutineOwned = true;
    for (let step = 0; step < 11; step += 1) {
      divided = applySteadyRoutineElapsed(divided, 250).state;
    }

    expect(divided.playableCore).toEqual(singleResult.playableCore);
  });

  it("combines fractional elapsed progress with manual Practice", () => {
    let state = automationReadyState();
    state.playableCore.steadyRoutineOwned = true;

    state = applySteadyRoutineElapsed(state, 1275).state;
    expect(state.playableCore.cycleProgress).toBe(25.5);

    state = performPractice(state).state;
    expect(state.playableCore.cycleProgress).toBe(65.5);
  });

  it("awards multiple delayed cycles without losing progress", () => {
    const state = automationReadyState();
    state.playableCore.mastery = 0;
    state.playableCore.steadyRoutineOwned = true;

    const result = applySteadyRoutineElapsed(state, 12_750);

    expect(result.completedCycles).toBe(2);
    expect(result.state.playableCore.mastery).toBe(2);
    expect(result.state.playableCore.trainingXp).toBe(50);
    expect(result.state.playableCore.cycleProgress).toBe(55);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid elapsed time %s",
    (elapsedMs) => {
      const state = automationReadyState();
      state.playableCore.steadyRoutineOwned = true;

      expect(applySteadyRoutineElapsed(state, elapsedMs)).toEqual({
        state,
        completedCycles: 0,
      });
    }
  );
});
