import type { GameState } from "./state";
import { PLAYABLE_CORE_CONFIG } from "./playableCoreConfig";
import {
  PRODUCTION_BASE_STEP_MS,
  calculateElapsedProduction,
} from "./production";

export { PLAYABLE_CORE_CONFIG, PLAYABLE_CORE_IDS } from "./playableCoreConfig";

export interface PlayableCoreProgressResult {
  state: GameState;
  completedCycles: number;
}

export interface RefinedTechniquePurchaseResult {
  state: GameState;
  purchased: boolean;
}

export interface SteadyRoutinePurchaseResult {
  state: GameState;
  purchased: boolean;
}

export type PlayableCoreGuidanceStage =
  | "refined_technique"
  | "steady_routine"
  | "automation_active";

export interface PlayableCoreGuidance {
  stage: PlayableCoreGuidanceStage;
  masteryRemaining: number;
}

function isValidCoreState(state: GameState): boolean {
  const core = state.playableCore;

  return (
    Number.isSafeInteger(core.mastery) &&
    core.mastery >= 0 &&
    Number.isSafeInteger(core.trainingXp) &&
    core.trainingXp >= 0 &&
    Number.isSafeInteger(core.completedCycles) &&
    core.completedCycles >= 0 &&
    Number.isFinite(core.cycleProgress) &&
    core.cycleProgress >= 0 &&
    core.cycleProgress < PLAYABLE_CORE_CONFIG.cycleProgressRequired &&
    typeof core.refinedTechniqueOwned === "boolean" &&
    typeof core.steadyRoutineOwned === "boolean" &&
    typeof core.firstTrialCompleted === "boolean"
  );
}

export function getPlayableCoreGuidance(
  state: GameState
): PlayableCoreGuidance {
  if (!isValidCoreState(state)) {
    return {
      stage: "refined_technique",
      masteryRemaining: PLAYABLE_CORE_CONFIG.refinedTechniqueCost,
    };
  }

  if (!state.playableCore.refinedTechniqueOwned) {
    return {
      stage: "refined_technique",
      masteryRemaining: Math.max(
        PLAYABLE_CORE_CONFIG.refinedTechniqueCost -
          state.playableCore.mastery,
        0
      ),
    };
  }

  if (!state.playableCore.steadyRoutineOwned) {
    return {
      stage: "steady_routine",
      masteryRemaining: Math.max(
        PLAYABLE_CORE_CONFIG.steadyRoutineCost - state.playableCore.mastery,
        0
      ),
    };
  }

  return { stage: "automation_active", masteryRemaining: 0 };
}

function applyCompletedCycles(
  state: GameState,
  completedCycles: number,
  cycleProgress: number
): PlayableCoreProgressResult {
  if (
    !Number.isSafeInteger(completedCycles) ||
    completedCycles < 0 ||
    !Number.isFinite(cycleProgress) ||
    cycleProgress < 0 ||
    cycleProgress >= PLAYABLE_CORE_CONFIG.cycleProgressRequired
  ) {
    return { state, completedCycles: 0 };
  }

  const masteryAward =
    completedCycles * PLAYABLE_CORE_CONFIG.masteryPerCycle;
  const xpAward =
    completedCycles * PLAYABLE_CORE_CONFIG.trainingXpPerCycle;
  const mastery = state.playableCore.mastery + masteryAward;
  const trainingXp = state.playableCore.trainingXp + xpAward;
  const lifetimeCycles =
    state.playableCore.completedCycles + completedCycles;

  if (
    !Number.isSafeInteger(masteryAward) ||
    !Number.isSafeInteger(xpAward) ||
    !Number.isSafeInteger(mastery) ||
    !Number.isSafeInteger(trainingXp) ||
    !Number.isSafeInteger(lifetimeCycles)
  ) {
    return { state, completedCycles: 0 };
  }

  if (
    completedCycles === 0 &&
    cycleProgress === state.playableCore.cycleProgress
  ) {
    return { state, completedCycles: 0 };
  }

  return {
    state: {
      ...state,
      playableCore: {
        ...state.playableCore,
        mastery,
        trainingXp,
        completedCycles: lifetimeCycles,
        cycleProgress,
      },
    },
    completedCycles,
  };
}

export function applyPlayableCoreProgress(
  state: GameState,
  progressAmount: number
): PlayableCoreProgressResult {
  if (
    !isValidCoreState(state) ||
    !Number.isSafeInteger(progressAmount) ||
    progressAmount <= 0
  ) {
    return { state, completedCycles: 0 };
  }

  const totalProgress = state.playableCore.cycleProgress + progressAmount;
  if (!Number.isFinite(totalProgress) || totalProgress > Number.MAX_SAFE_INTEGER) {
    return { state, completedCycles: 0 };
  }

  const completedCycles = Math.floor(
    totalProgress / PLAYABLE_CORE_CONFIG.cycleProgressRequired
  );
  const cycleProgress =
    totalProgress % PLAYABLE_CORE_CONFIG.cycleProgressRequired;
  return applyCompletedCycles(state, completedCycles, cycleProgress);
}

export function performPractice(state: GameState): PlayableCoreProgressResult {
  return applyPlayableCoreProgress(
    state,
    state.playableCore.refinedTechniqueOwned
      ? PLAYABLE_CORE_CONFIG.upgradedPracticeProgress
      : PLAYABLE_CORE_CONFIG.basePracticeProgress
  );
}

export function purchaseRefinedTechnique(
  state: GameState
): RefinedTechniquePurchaseResult {
  if (
    !isValidCoreState(state) ||
    state.playableCore.refinedTechniqueOwned ||
    state.playableCore.mastery < PLAYABLE_CORE_CONFIG.refinedTechniqueCost
  ) {
    return { state, purchased: false };
  }

  return {
    state: {
      ...state,
      playableCore: {
        ...state.playableCore,
        mastery:
          state.playableCore.mastery -
          PLAYABLE_CORE_CONFIG.refinedTechniqueCost,
        refinedTechniqueOwned: true,
      },
    },
    purchased: true,
  };
}

export function purchaseSteadyRoutine(
  state: GameState
): SteadyRoutinePurchaseResult {
  if (
    !isValidCoreState(state) ||
    !state.playableCore.refinedTechniqueOwned ||
    state.playableCore.steadyRoutineOwned ||
    state.playableCore.mastery < PLAYABLE_CORE_CONFIG.steadyRoutineCost
  ) {
    return { state, purchased: false };
  }

  return {
    state: {
      ...state,
      playableCore: {
        ...state.playableCore,
        mastery:
          state.playableCore.mastery -
          PLAYABLE_CORE_CONFIG.steadyRoutineCost,
        steadyRoutineOwned: true,
      },
    },
    purchased: true,
  };
}

export function applySteadyRoutineElapsed(
  state: GameState,
  elapsedMs: number
): PlayableCoreProgressResult {
  if (
    !isValidCoreState(state) ||
    !state.playableCore.steadyRoutineOwned ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0
  ) {
    return { state, completedCycles: 0 };
  }

  const speedPerBaseStep =
    (PLAYABLE_CORE_CONFIG.automationProgressPerSecond *
      PRODUCTION_BASE_STEP_MS) /
    1000;
  const production = calculateElapsedProduction(
    speedPerBaseStep,
    elapsedMs,
    state.playableCore.cycleProgress
  );
  const normalizedProgress =
    Math.round(production.progress * 1_000_000) / 1_000_000;

  return applyCompletedCycles(
    state,
    production.completedItems,
    normalizedProgress
  );
}
