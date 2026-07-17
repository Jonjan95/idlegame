import { DEFAULT_TOOLS, type Tools } from "../lib/resources";
import { PLAYABLE_CORE_CONFIG } from "./playableCoreConfig";

export const CURRENT_SAVE_VERSION = 1 as const;

export type SkillName = "woodcutting" | "mining";

export interface PlayableCoreState {
  mastery: number;
  trainingXp: number;
  completedCycles: number;
  cycleProgress: number;
  refinedTechniqueOwned: boolean;
  steadyRoutineOwned: boolean;
}

/**
 * Persistent economy and progression state.
 *
 * XP and production totals are cumulative lifetime values. Inventory and gold
 * are spendable balances.
 */
export interface GameState {
  wcXp: number;
  wcLogs: number;
  miningXp: number;
  miningOres: number;
  gold: number;
  tools: Tools;
  inventory: Record<string, number>;
  playableCore: PlayableCoreState;
}

export interface ResourceSelections {
  woodcutting: string;
  mining: string;
}

export interface ActiveActivity {
  skill: SkillName;
  resourceId: string;
  startedAt: number;
}

/**
 * Canonical target envelope for versioned persistence.
 *
 * The browser persistence adapter stores this versioned envelope and migrates
 * the earlier individual localStorage keys on first load.
 */
export interface GameSave {
  version: typeof CURRENT_SAVE_VERSION;
  state: GameState;
  selections: ResourceSelections;
  activeActivity: ActiveActivity | null;
}

export interface StateValidationIssue {
  path: string;
  message: string;
}

export function createDefaultGameState(): GameState {
  return {
    wcXp: 0,
    wcLogs: 0,
    miningXp: 0,
    miningOres: 0,
    gold: 0,
    tools: { ...DEFAULT_TOOLS },
    inventory: {},
    playableCore: {
      mastery: 0,
      trainingXp: 0,
      completedCycles: 0,
      cycleProgress: 0,
      refinedTechniqueOwned: false,
      steadyRoutineOwned: false,
    },
  };
}

export function createDefaultResourceSelections(): ResourceSelections {
  return {
    woodcutting: "tree",
    mining: "rock",
  };
}

export function createDefaultGameSave(): GameSave {
  return {
    version: CURRENT_SAVE_VERSION,
    state: createDefaultGameState(),
    selections: createDefaultResourceSelections(),
    activeActivity: null,
  };
}

function validateNonNegativeInteger(
  value: number,
  path: string
): StateValidationIssue[] {
  if (!Number.isFinite(value)) {
    return [{ path, message: "must be finite" }];
  }
  if (!Number.isInteger(value)) {
    return [{ path, message: "must be an integer" }];
  }
  if (value < 0) {
    return [{ path, message: "must not be negative" }];
  }
  return [];
}

function validateNonNegativeFinite(
  value: number,
  path: string
): StateValidationIssue[] {
  if (!Number.isFinite(value)) {
    return [{ path, message: "must be finite" }];
  }
  if (value < 0) {
    return [{ path, message: "must not be negative" }];
  }
  return [];
}

function validateIdentifier(
  value: string,
  path: string
): StateValidationIssue[] {
  if (value.trim().length === 0) {
    return [{ path, message: "must not be empty" }];
  }
  return [];
}

export function validateGameState(state: GameState): StateValidationIssue[] {
  const issues = [
    ...validateNonNegativeInteger(state.wcXp, "state.wcXp"),
    ...validateNonNegativeInteger(state.wcLogs, "state.wcLogs"),
    ...validateNonNegativeInteger(state.miningXp, "state.miningXp"),
    ...validateNonNegativeInteger(state.miningOres, "state.miningOres"),
    ...validateNonNegativeInteger(state.gold, "state.gold"),
    ...validateNonNegativeInteger(
      state.playableCore.mastery,
      "state.playableCore.mastery"
    ),
    ...validateNonNegativeInteger(
      state.playableCore.trainingXp,
      "state.playableCore.trainingXp"
    ),
    ...validateNonNegativeInteger(
      state.playableCore.completedCycles,
      "state.playableCore.completedCycles"
    ),
    ...validateNonNegativeFinite(
      state.playableCore.cycleProgress,
      "state.playableCore.cycleProgress"
    ),
  ];

  if (
    state.playableCore.cycleProgress >=
    PLAYABLE_CORE_CONFIG.cycleProgressRequired
  ) {
    issues.push({
      path: "state.playableCore.cycleProgress",
      message: `must be less than ${PLAYABLE_CORE_CONFIG.cycleProgressRequired}`,
    });
  }

  if (typeof state.playableCore.refinedTechniqueOwned !== "boolean") {
    issues.push({
      path: "state.playableCore.refinedTechniqueOwned",
      message: "must be a boolean",
    });
  }

  if (typeof state.playableCore.steadyRoutineOwned !== "boolean") {
    issues.push({
      path: "state.playableCore.steadyRoutineOwned",
      message: "must be a boolean",
    });
  }

  for (const [itemId, quantity] of Object.entries(state.inventory)) {
    issues.push(...validateIdentifier(itemId, `state.inventory.${itemId}`));
    issues.push(
      ...validateNonNegativeInteger(
        quantity,
        `state.inventory.${itemId || "<empty>"}`
      )
    );
  }

  for (const [toolId, owned] of Object.entries(state.tools)) {
    if (typeof owned !== "boolean") {
      issues.push({
        path: `state.tools.${toolId}`,
        message: "must be a boolean",
      });
    }
  }

  return issues;
}

export function validateResourceSelections(
  selections: ResourceSelections
): StateValidationIssue[] {
  return [
    ...validateIdentifier(
      selections.woodcutting,
      "selections.woodcutting"
    ),
    ...validateIdentifier(selections.mining, "selections.mining"),
  ];
}

export function validateActiveActivity(
  activity: ActiveActivity | null
): StateValidationIssue[] {
  if (!activity) return [];

  const issues: StateValidationIssue[] = [];

  if (activity.skill !== "woodcutting" && activity.skill !== "mining") {
    issues.push({
      path: "activeActivity.skill",
      message: "must be a known skill",
    });
  }

  return [
    ...issues,
    ...validateIdentifier(activity.resourceId, "activeActivity.resourceId"),
    ...validateNonNegativeInteger(
      activity.startedAt,
      "activeActivity.startedAt"
    ),
  ];
}

export function validateGameSave(save: GameSave): StateValidationIssue[] {
  const issues: StateValidationIssue[] = [];

  if (save.version !== CURRENT_SAVE_VERSION) {
    issues.push({
      path: "version",
      message: `must equal ${CURRENT_SAVE_VERSION}`,
    });
  }

  return [
    ...issues,
    ...validateGameState(save.state),
    ...validateResourceSelections(save.selections),
    ...validateActiveActivity(save.activeActivity),
  ];
}
