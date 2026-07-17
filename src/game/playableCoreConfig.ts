import { PRODUCTION_PROGRESS_MAX } from "./production";

export const PLAYABLE_CORE_IDS = {
  manualAction: "manual_practice",
  resource: "mastery",
  progression: "training_xp",
  upgrade: "refined_technique",
  automation: "steady_routine",
} as const;

export const PLAYABLE_CORE_CONFIG = {
  cycleProgressRequired: PRODUCTION_PROGRESS_MAX,
  basePracticeProgress: 25,
  masteryPerCycle: 1,
  trainingXpPerCycle: 25,
  refinedTechniqueCost: 3,
  upgradedPracticeProgress: 40,
  steadyRoutineCost: 8,
  automationProgressPerSecond: 20,
} as const;
