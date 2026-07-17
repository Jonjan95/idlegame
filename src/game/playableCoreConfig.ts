export const PLAYABLE_CORE_IDS = {
  manualAction: "manual_practice",
  resource: "mastery",
  progression: "training_xp",
  upgrade: "refined_technique",
  automation: "steady_routine",
} as const;

export const PLAYABLE_CORE_CONFIG = {
  cycleProgressRequired: 100,
  basePracticeProgress: 25,
  masteryPerCycle: 1,
  trainingXpPerCycle: 25,
} as const;
