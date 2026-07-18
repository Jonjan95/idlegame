import { xpForLevel } from "../lib/xp";

export const FIRST_TRIAL_IDS = {
  capability: "training_level",
  objective: "first_trial",
  completion: "first_trial_completed",
  followUpObjective: "reach_training_level_4",
} as const;

const requiredTrainingLevel = 3;
const followUpTrainingLevel = 4;

export const FIRST_TRIAL_CONFIG = {
  requiredTrainingLevel,
  requiredTrainingXp: xpForLevel(requiredTrainingLevel),
  followUpTrainingLevel,
} as const;
