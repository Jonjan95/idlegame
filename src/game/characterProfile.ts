import { levelProgressPercent, xpForLevel, xpToLevel } from "../lib/xp";
import { FIRST_TRIAL_CONFIG, getFirstTrialStatus } from "./firstTrial";
import { CHARACTER_PROFILE_CONFIG } from "./characterProfileConfig";
import type { GameState } from "./state";

export interface CharacterProfileState {
  name: string;
}

export type CharacterNameIssue = "empty" | "too_long";

export type CharacterNameResult =
  | { accepted: true; name: string }
  | { accepted: false; issue: CharacterNameIssue };

export interface CharacterProgressSummary {
  name: string;
  initial: string;
  trainingLevel: number;
  trainingXp: number;
  trainingLevelProgress: number;
  nextTrainingLevelXp: number;
  stage: "training" | "trial_proven";
  stageLabel: "Training in progress" | "Trial proven";
  firstTrialCompleted: boolean;
  nextObjective: string;
}

export function createDefaultCharacterProfile(): CharacterProfileState {
  return { name: CHARACTER_PROFILE_CONFIG.defaultName };
}

export function normalizeCharacterName(input: unknown): CharacterNameResult {
  if (typeof input !== "string") return { accepted: false, issue: "empty" };

  const name = input.trim().replace(/\s+/gu, " ");
  if (name.length === 0) return { accepted: false, issue: "empty" };
  if (Array.from(name).length > CHARACTER_PROFILE_CONFIG.maximumNameLength) {
    return { accepted: false, issue: "too_long" };
  }

  return { accepted: true, name };
}

export function renameCharacter(
  state: GameState,
  input: unknown
): { state: GameState; result: CharacterNameResult } {
  const result = normalizeCharacterName(input);
  if (!result.accepted || result.name === state.character.name) {
    return { state, result };
  }

  return {
    state: {
      ...state,
      character: { name: result.name },
    },
    result,
  };
}

export function getCharacterProgressSummary(
  state: GameState
): CharacterProgressSummary {
  const firstTrialCompleted = state.playableCore.firstTrialCompleted;
  const trainingLevel = xpToLevel(state.playableCore.trainingXp);
  const firstTrial = getFirstTrialStatus(state);

  return {
    name: state.character.name,
    initial: Array.from(state.character.name)[0]?.toLocaleUpperCase() ?? "?",
    trainingLevel,
    trainingXp: state.playableCore.trainingXp,
    trainingLevelProgress: levelProgressPercent(state.playableCore.trainingXp),
    nextTrainingLevelXp: xpForLevel(trainingLevel + 1),
    stage: firstTrialCompleted ? "trial_proven" : "training",
    stageLabel: firstTrialCompleted ? "Trial proven" : "Training in progress",
    firstTrialCompleted,
    nextObjective:
      firstTrial.stage === "completed"
        ? `Reach Training Level ${FIRST_TRIAL_CONFIG.followUpTrainingLevel}`
        : firstTrial.stage === "ready"
          ? "Attempt the First Trial"
          : `Reach Training Level ${FIRST_TRIAL_CONFIG.requiredTrainingLevel}`,
  };
}
