import { xpToLevel } from "../lib/xp";
import type { GameState } from "./state";
import { FIRST_TRIAL_CONFIG } from "./firstTrialConfig";

export { FIRST_TRIAL_CONFIG, FIRST_TRIAL_IDS } from "./firstTrialConfig";

export type FirstTrialStage = "locked" | "ready" | "completed";

export interface FirstTrialStatus {
  stage: FirstTrialStage;
  trainingLevel: number;
  requiredTrainingLevel: number;
  trainingXp: number;
  requiredTrainingXp: number;
}

export interface FirstTrialAttemptResult {
  state: GameState;
  completed: boolean;
}

function hasValidTrialState(state: GameState): boolean {
  return (
    Number.isSafeInteger(state.playableCore.trainingXp) &&
    state.playableCore.trainingXp >= 0 &&
    typeof state.playableCore.firstTrialCompleted === "boolean"
  );
}

export function getFirstTrialStatus(state: GameState): FirstTrialStatus {
  const trainingXp =
    Number.isSafeInteger(state.playableCore.trainingXp) &&
    state.playableCore.trainingXp >= 0
      ? state.playableCore.trainingXp
      : 0;
  const trainingLevel = xpToLevel(trainingXp);
  const stage: FirstTrialStage =
    state.playableCore.firstTrialCompleted === true
      ? "completed"
      : trainingXp >= FIRST_TRIAL_CONFIG.requiredTrainingXp
        ? "ready"
        : "locked";

  return {
    stage,
    trainingLevel,
    requiredTrainingLevel: FIRST_TRIAL_CONFIG.requiredTrainingLevel,
    trainingXp,
    requiredTrainingXp: FIRST_TRIAL_CONFIG.requiredTrainingXp,
  };
}

export function attemptFirstTrial(
  state: GameState
): FirstTrialAttemptResult {
  if (
    !hasValidTrialState(state) ||
    getFirstTrialStatus(state).stage !== "ready"
  ) {
    return { state, completed: false };
  }

  return {
    state: {
      ...state,
      playableCore: {
        ...state.playableCore,
        firstTrialCompleted: true,
      },
    },
    completed: true,
  };
}
