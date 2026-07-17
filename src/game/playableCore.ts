import type { GameState } from "./state";
import { PLAYABLE_CORE_CONFIG } from "./playableCoreConfig";

export { PLAYABLE_CORE_CONFIG, PLAYABLE_CORE_IDS } from "./playableCoreConfig";

export interface PlayableCoreProgressResult {
  state: GameState;
  completedCycles: number;
}

export interface RefinedTechniquePurchaseResult {
  state: GameState;
  purchased: boolean;
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
    Number.isSafeInteger(core.cycleProgress) &&
    core.cycleProgress >= 0 &&
    core.cycleProgress < PLAYABLE_CORE_CONFIG.cycleProgressRequired &&
    typeof core.refinedTechniqueOwned === "boolean"
  );
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
  if (!Number.isSafeInteger(totalProgress)) {
    return { state, completedCycles: 0 };
  }

  const completedCycles = Math.floor(
    totalProgress / PLAYABLE_CORE_CONFIG.cycleProgressRequired
  );
  const cycleProgress =
    totalProgress % PLAYABLE_CORE_CONFIG.cycleProgressRequired;
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
