import { ROCKS, TREES, type Tools } from "../lib/resources";
import { PLAYABLE_CORE_CONFIG } from "../game/playableCoreConfig";
import {
  CURRENT_SAVE_VERSION,
  createDefaultGameSave,
  type ActiveActivity,
  type GameSave,
  type GameState,
  type ResourceSelections,
  type SkillName,
} from "../game/state";

export const GAME_SAVE_KEY = "idlegame.save";
export const GAME_SAVE_RECOVERY_KEY = "idlegame.save.recovery";

export const LEGACY_GAME_KEYS = [
  "wc_xp",
  "wc_logs",
  "mining_xp",
  "mining_ores",
  "gold",
  "tools",
  "inventory",
  "selected_tree",
  "selected_rock",
  "active_skill",
  "active_skill_start",
  "playable_core_mastery",
  "playable_core_training_xp",
  "playable_core_completed_cycles",
  "playable_core_cycle_progress",
  "playable_core_refined_technique",
  "playable_core_steady_routine",
] as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type GameSaveSource =
  | "canonical"
  | "migrated"
  | "legacy"
  | "default"
  | "recovered";

export interface LoadGameSaveResult {
  save: GameSave;
  source: GameSaveSource;
  issues: string[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  path: string,
  issues: string[]
): number {
  if (Number.isSafeInteger(value) && (value as number) >= 0) {
    return value as number;
  }
  if (value !== undefined) issues.push(`${path} used its default`);
  return fallback;
}

function normalizeProgress(
  value: unknown,
  fallback: number,
  path: string,
  issues: string[]
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value < PLAYABLE_CORE_CONFIG.cycleProgressRequired
  ) {
    return value;
  }
  if (value !== undefined) issues.push(`${path} used its default`);
  return fallback;
}

function normalizeBoolean(
  value: unknown,
  fallback: boolean,
  path: string,
  issues: string[]
): boolean {
  if (typeof value === "boolean") return value;
  if (value !== undefined) issues.push(`${path} used its default`);
  return fallback;
}

function normalizeTools(
  value: unknown,
  fallback: Tools,
  issues: string[]
): Tools {
  if (!isRecord(value)) {
    if (value !== undefined) issues.push("state.tools used its default");
    return { ...fallback };
  }

  return {
    bronzeAxe: normalizeBoolean(
      value.bronzeAxe,
      fallback.bronzeAxe,
      "state.tools.bronzeAxe",
      issues
    ),
    ironAxe: normalizeBoolean(
      value.ironAxe,
      fallback.ironAxe,
      "state.tools.ironAxe",
      issues
    ),
    bronzePickaxe: normalizeBoolean(
      value.bronzePickaxe,
      fallback.bronzePickaxe,
      "state.tools.bronzePickaxe",
      issues
    ),
    ironPickaxe: normalizeBoolean(
      value.ironPickaxe,
      fallback.ironPickaxe,
      "state.tools.ironPickaxe",
      issues
    ),
  };
}

function normalizeInventory(
  value: unknown,
  issues: string[]
): Record<string, number> {
  if (!isRecord(value)) {
    if (value !== undefined) issues.push("state.inventory used its default");
    return {};
  }

  const inventory: Record<string, number> = {};
  for (const [itemId, quantity] of Object.entries(value)) {
    if (
      itemId.trim().length > 0 &&
      Number.isSafeInteger(quantity) &&
      (quantity as number) >= 0
    ) {
      inventory[itemId] = quantity as number;
    } else {
      issues.push(`state.inventory.${itemId || "<empty>"} was removed`);
    }
  }
  return inventory;
}

function normalizeState(
  value: unknown,
  defaults: GameState,
  issues: string[],
  supportsFirstTrialCompletion = true
): GameState {
  const state = isRecord(value) ? value : {};
  if (!isRecord(value) && value !== undefined) {
    issues.push("state used its default");
  }
  const playableCore = isRecord(state.playableCore)
    ? state.playableCore
    : {};
  if (!isRecord(state.playableCore) && state.playableCore !== undefined) {
    issues.push("state.playableCore used its default");
  }

  return {
    wcXp: normalizeInteger(state.wcXp, defaults.wcXp, "state.wcXp", issues),
    wcLogs: normalizeInteger(
      state.wcLogs,
      defaults.wcLogs,
      "state.wcLogs",
      issues
    ),
    miningXp: normalizeInteger(
      state.miningXp,
      defaults.miningXp,
      "state.miningXp",
      issues
    ),
    miningOres: normalizeInteger(
      state.miningOres,
      defaults.miningOres,
      "state.miningOres",
      issues
    ),
    gold: normalizeInteger(state.gold, defaults.gold, "state.gold", issues),
    tools: normalizeTools(state.tools, defaults.tools, issues),
    inventory: normalizeInventory(state.inventory, issues),
    playableCore: {
      mastery: normalizeInteger(
        playableCore.mastery,
        defaults.playableCore.mastery,
        "state.playableCore.mastery",
        issues
      ),
      trainingXp: normalizeInteger(
        playableCore.trainingXp,
        defaults.playableCore.trainingXp,
        "state.playableCore.trainingXp",
        issues
      ),
      completedCycles: normalizeInteger(
        playableCore.completedCycles,
        defaults.playableCore.completedCycles,
        "state.playableCore.completedCycles",
        issues
      ),
      cycleProgress: normalizeProgress(
        playableCore.cycleProgress,
        defaults.playableCore.cycleProgress,
        "state.playableCore.cycleProgress",
        issues
      ),
      refinedTechniqueOwned: normalizeBoolean(
        playableCore.refinedTechniqueOwned,
        defaults.playableCore.refinedTechniqueOwned,
        "state.playableCore.refinedTechniqueOwned",
        issues
      ),
      steadyRoutineOwned: normalizeBoolean(
        playableCore.steadyRoutineOwned,
        defaults.playableCore.steadyRoutineOwned,
        "state.playableCore.steadyRoutineOwned",
        issues
      ),
      firstTrialCompleted: normalizeBoolean(
        supportsFirstTrialCompletion
          ? playableCore.firstTrialCompleted
          : undefined,
        defaults.playableCore.firstTrialCompleted,
        "state.playableCore.firstTrialCompleted",
        issues
      ),
    },
  };
}

const treeIds = new Set(TREES.map((resource) => resource.id));
const rockIds = new Set(ROCKS.map((resource) => resource.id));

function normalizeSelection(
  value: unknown,
  fallback: string,
  validIds: Set<string>,
  path: string,
  issues: string[]
): string {
  if (typeof value === "string" && validIds.has(value)) return value;
  if (value !== undefined) issues.push(`${path} used its default`);
  return fallback;
}

function normalizeSelections(
  value: unknown,
  defaults: ResourceSelections,
  issues: string[]
): ResourceSelections {
  const selections = isRecord(value) ? value : {};
  if (!isRecord(value) && value !== undefined) {
    issues.push("selections used their defaults");
  }

  return {
    woodcutting: normalizeSelection(
      selections.woodcutting,
      defaults.woodcutting,
      treeIds,
      "selections.woodcutting",
      issues
    ),
    mining: normalizeSelection(
      selections.mining,
      defaults.mining,
      rockIds,
      "selections.mining",
      issues
    ),
  };
}

function isSkill(value: unknown): value is SkillName {
  return value === "woodcutting" || value === "mining";
}

function normalizeActivity(
  value: unknown,
  issues: string[]
): ActiveActivity | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isSkill(value.skill)) {
    issues.push("activeActivity was cleared");
    return null;
  }

  const validIds = value.skill === "woodcutting" ? treeIds : rockIds;
  if (
    typeof value.resourceId !== "string" ||
    !validIds.has(value.resourceId) ||
    !Number.isSafeInteger(value.startedAt) ||
    (value.startedAt as number) <= 0
  ) {
    issues.push("activeActivity was cleared");
    return null;
  }

  return {
    skill: value.skill,
    resourceId: value.resourceId,
    startedAt: value.startedAt as number,
  };
}

export function normalizeGameSave(value: unknown): LoadGameSaveResult {
  const defaults = createDefaultGameSave();
  if (
    !isRecord(value) ||
    (value.version !== 1 && value.version !== CURRENT_SAVE_VERSION)
  ) {
    return {
      save: defaults,
      source: "recovered",
      issues: ["save version is missing or unsupported"],
    };
  }

  const issues: string[] = [];
  return {
    save: {
      version: CURRENT_SAVE_VERSION,
      state: normalizeState(
        value.state,
        defaults.state,
        issues,
        value.version === CURRENT_SAVE_VERSION
      ),
      selections: normalizeSelections(
        value.selections,
        defaults.selections,
        issues
      ),
      activeActivity: normalizeActivity(value.activeActivity, issues),
    },
    source: value.version === 1 ? "migrated" : "canonical",
    issues,
  };
}

function parseLegacyJson(storage: StorageLike, key: string): unknown {
  const text = storage.getItem(key);
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseLegacyNumber(storage: StorageLike, key: string): unknown {
  const text = storage.getItem(key);
  if (text === null || text.trim().length === 0) return undefined;
  return Number(text);
}

function parseLegacyBoolean(storage: StorageLike, key: string): unknown {
  const text = storage.getItem(key);
  if (text === null) return undefined;
  if (text === "true") return true;
  if (text === "false") return false;
  return text;
}

function migrateLegacySave(
  storage: StorageLike
): { save: GameSave; issues: string[] } {
  const defaults = createDefaultGameSave();
  const issues: string[] = [];
  const selections = normalizeSelections(
    {
      woodcutting: storage.getItem("selected_tree") ?? undefined,
      mining: storage.getItem("selected_rock") ?? undefined,
    },
    defaults.selections,
    issues
  );
  const skill = storage.getItem("active_skill");
  const startedAt = parseLegacyNumber(storage, "active_skill_start");
  const activeActivity = isSkill(skill)
    ? normalizeActivity(
        {
          skill,
          resourceId:
            skill === "woodcutting"
              ? selections.woodcutting
              : selections.mining,
          startedAt,
        },
        issues
      )
    : null;

  return {
    save: {
      version: CURRENT_SAVE_VERSION,
      state: normalizeState(
        {
          wcXp: parseLegacyNumber(storage, "wc_xp"),
          wcLogs: parseLegacyNumber(storage, "wc_logs"),
          miningXp: parseLegacyNumber(storage, "mining_xp"),
          miningOres: parseLegacyNumber(storage, "mining_ores"),
          gold: parseLegacyNumber(storage, "gold"),
          tools: parseLegacyJson(storage, "tools"),
          inventory: parseLegacyJson(storage, "inventory"),
          playableCore: {
            mastery: parseLegacyNumber(storage, "playable_core_mastery"),
            trainingXp: parseLegacyNumber(
              storage,
              "playable_core_training_xp"
            ),
            completedCycles: parseLegacyNumber(
              storage,
              "playable_core_completed_cycles"
            ),
            cycleProgress: parseLegacyNumber(
              storage,
              "playable_core_cycle_progress"
            ),
            refinedTechniqueOwned: parseLegacyBoolean(
              storage,
              "playable_core_refined_technique"
            ),
            steadyRoutineOwned: parseLegacyBoolean(
              storage,
              "playable_core_steady_routine"
            ),
          },
        },
        defaults.state,
        issues
      ),
      selections,
      activeActivity,
    },
    issues,
  };
}

export function saveGameSave(storage: StorageLike, save: GameSave): GameSave {
  const normalized = normalizeGameSave(save).save;
  storage.setItem(GAME_SAVE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadGameSave(storage: StorageLike): LoadGameSaveResult {
  const canonicalText = storage.getItem(GAME_SAVE_KEY);
  if (canonicalText !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(canonicalText);
    } catch {
      storage.setItem(GAME_SAVE_RECOVERY_KEY, canonicalText);
      const recovered = createDefaultGameSave();
      saveGameSave(storage, recovered);
      return {
        save: recovered,
        source: "recovered",
        issues: ["canonical save JSON was malformed"],
      };
    }

    const normalized = normalizeGameSave(parsed);
    if (normalized.source === "recovered") {
      storage.setItem(GAME_SAVE_RECOVERY_KEY, canonicalText);
    }
    saveGameSave(storage, normalized.save);
    return normalized;
  }

  const hasLegacyData = LEGACY_GAME_KEYS.some(
    (key) => storage.getItem(key) !== null
  );
  if (hasLegacyData) {
    const migrated = migrateLegacySave(storage);
    saveGameSave(storage, migrated.save);
    return {
      save: migrated.save,
      source: "legacy",
      issues: migrated.issues,
    };
  }

  const save = createDefaultGameSave();
  saveGameSave(storage, save);
  return { save, source: "default", issues: [] };
}

export function clearGameStorage(storage: StorageLike): void {
  storage.removeItem(GAME_SAVE_KEY);
  storage.removeItem(GAME_SAVE_RECOVERY_KEY);
  for (const key of LEGACY_GAME_KEYS) storage.removeItem(key);
}
