import { describe, expect, it } from "vitest";
import { createDefaultGameSave } from "../game/state";
import {
  GAME_SAVE_KEY,
  GAME_SAVE_RECOVERY_KEY,
  LEGACY_GAME_KEYS,
  clearGameStorage,
  loadGameSave,
  saveGameSave,
  type StorageLike,
} from "./gameStorage";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("versioned game storage", () => {
  it("creates and stores a valid default save", () => {
    const storage = new MemoryStorage();
    const result = loadGameSave(storage);

    expect(result).toEqual({
      save: createDefaultGameSave(),
      source: "default",
      issues: [],
    });
    expect(JSON.parse(storage.getItem(GAME_SAVE_KEY)!)).toEqual(result.save);
  });

  it("round trips all canonical version 3 fields", () => {
    const storage = new MemoryStorage();
    const save = createDefaultGameSave();
    save.state.character.name = "Mira Stone";
    save.state.wcXp = 250;
    save.state.wcLogs = 10;
    save.state.miningXp = 100;
    save.state.miningOres = 4;
    save.state.gold = 42;
    save.state.tools.bronzeAxe = true;
    save.state.inventory.tree = 7;
    save.state.playableCore = {
      mastery: 3,
      trainingXp: 275,
      completedCycles: 11,
      cycleProgress: 25.5,
      refinedTechniqueOwned: true,
      steadyRoutineOwned: true,
      firstTrialCompleted: true,
    };
    save.selections = { woodcutting: "oak", mining: "copper" };
    save.activeActivity = {
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    };

    saveGameSave(storage, save);
    const result = loadGameSave(storage);

    expect(result.source).toBe("canonical");
    expect(result.issues).toEqual([]);
    expect(result.save).toEqual(save);
  });

  it("migrates a canonical version 1 save without losing progress", () => {
    const storage = new MemoryStorage();
    const version1 = createDefaultGameSave() as unknown as Record<
      string,
      unknown
    >;
    version1.version = 1;
    const state = version1.state as Record<string, unknown>;
    state.wcXp = 250;
    state.gold = 42;
    state.inventory = { tree: 7 };
    state.tools = {
      bronzeAxe: true,
      ironAxe: false,
      bronzePickaxe: false,
      ironPickaxe: false,
    };
    const playableCore = state.playableCore as Record<string, unknown>;
    playableCore.mastery = 5;
    playableCore.trainingXp = 400;
    playableCore.completedCycles = 16;
    playableCore.refinedTechniqueOwned = true;
    playableCore.steadyRoutineOwned = true;
    playableCore.firstTrialCompleted = true;
    version1.selections = { woodcutting: "oak", mining: "copper" };
    version1.activeActivity = {
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    };
    storage.setItem(GAME_SAVE_KEY, JSON.stringify(version1));

    const result = loadGameSave(storage);

    expect(result.source).toBe("migrated");
    expect(result.issues).toEqual([]);
    expect(result.save.version).toBe(3);
    expect(result.save.state.character).toEqual({ name: "Trainee" });
    expect(result.save.state.wcXp).toBe(250);
    expect(result.save.state.gold).toBe(42);
    expect(result.save.state.inventory).toEqual({ tree: 7 });
    expect(result.save.state.tools.bronzeAxe).toBe(true);
    expect(result.save.state.playableCore).toMatchObject({
      mastery: 5,
      trainingXp: 400,
      completedCycles: 16,
      refinedTechniqueOwned: true,
      steadyRoutineOwned: true,
      firstTrialCompleted: false,
    });
    expect(result.save.selections).toEqual({
      woodcutting: "oak",
      mining: "copper",
    });
    expect(result.save.activeActivity).toEqual({
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    });
    expect(JSON.parse(storage.getItem(GAME_SAVE_KEY)!)).toEqual(result.save);
  });

  it("migrates a canonical version 2 save with its trial progress intact", () => {
    const storage = new MemoryStorage();
    const version2 = createDefaultGameSave() as unknown as Record<
      string,
      unknown
    >;
    version2.version = 2;
    const state = version2.state as Record<string, unknown>;
    delete state.character;
    state.wcXp = 250;
    state.inventory = { tree: 7 };
    const playableCore = state.playableCore as Record<string, unknown>;
    playableCore.trainingXp = 400;
    playableCore.firstTrialCompleted = true;
    version2.selections = { woodcutting: "oak", mining: "copper" };
    version2.activeActivity = {
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    };
    storage.setItem(GAME_SAVE_KEY, JSON.stringify(version2));

    const result = loadGameSave(storage);

    expect(result.source).toBe("migrated");
    expect(result.issues).toEqual([]);
    expect(result.save.version).toBe(3);
    expect(result.save.state.character).toEqual({ name: "Trainee" });
    expect(result.save.state.wcXp).toBe(250);
    expect(result.save.state.inventory).toEqual({ tree: 7 });
    expect(result.save.state.playableCore.trainingXp).toBe(400);
    expect(result.save.state.playableCore.firstTrialCompleted).toBe(true);
    expect(result.save.selections).toEqual({
      woodcutting: "oak",
      mining: "copper",
    });
    expect(result.save.activeActivity).toEqual({
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    });
  });

  it("migrates every legacy field without removing the legacy snapshot", () => {
    const storage = new MemoryStorage();
    const legacy = {
      wc_xp: "250",
      wc_logs: "10",
      mining_xp: "100",
      mining_ores: "4",
      gold: "42",
      tools: JSON.stringify({
        bronzeAxe: true,
        ironAxe: false,
        bronzePickaxe: true,
        ironPickaxe: false,
      }),
      inventory: JSON.stringify({ tree: 7, copper: 2 }),
      selected_tree: "oak",
      selected_rock: "copper",
      active_skill: "woodcutting",
      active_skill_start: "1750000000000",
      playable_core_mastery: "3",
      playable_core_training_xp: "275",
      playable_core_completed_cycles: "11",
      playable_core_cycle_progress: "25.5",
      playable_core_refined_technique: "true",
      playable_core_steady_routine: "true",
    };
    for (const [key, value] of Object.entries(legacy)) {
      storage.setItem(key, value);
    }

    const result = loadGameSave(storage);

    expect(result.source).toBe("legacy");
    expect(result.save.state).toEqual({
      character: { name: "Trainee" },
      wcXp: 250,
      wcLogs: 10,
      miningXp: 100,
      miningOres: 4,
      gold: 42,
      tools: {
        bronzeAxe: true,
        ironAxe: false,
        bronzePickaxe: true,
        ironPickaxe: false,
      },
      inventory: { tree: 7, copper: 2 },
      playableCore: {
        mastery: 3,
        trainingXp: 275,
        completedCycles: 11,
        cycleProgress: 25.5,
        refinedTechniqueOwned: true,
        steadyRoutineOwned: true,
        firstTrialCompleted: false,
      },
    });
    expect(result.save.selections).toEqual({
      woodcutting: "oak",
      mining: "copper",
    });
    expect(result.save.activeActivity).toEqual({
      skill: "woodcutting",
      resourceId: "oak",
      startedAt: 1_750_000_000_000,
    });
    expect(storage.getItem(GAME_SAVE_KEY)).not.toBeNull();
    expect(storage.getItem("wc_xp")).toBe("250");
  });

  it("retains valid partial legacy values and defaults malformed neighbors", () => {
    const storage = new MemoryStorage();
    storage.setItem("wc_xp", "125");
    storage.setItem("gold", "-4");
    storage.setItem("tools", "not-json");
    storage.setItem(
      "inventory",
      JSON.stringify({ tree: 2, rock: -1, copper: 1.5, "": 3 })
    );
    storage.setItem("selected_tree", "unknown");
    storage.setItem("active_skill", "unknown");

    const result = loadGameSave(storage);

    expect(result.source).toBe("legacy");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.save.state.wcXp).toBe(125);
    expect(result.save.state.gold).toBe(0);
    expect(result.save.state.tools).toEqual(
      createDefaultGameSave().state.tools
    );
    expect(result.save.state.inventory).toEqual({ tree: 2 });
    expect(result.save.selections.woodcutting).toBe("tree");
    expect(result.save.activeActivity).toBeNull();
  });

  it("normalizes invalid canonical fields independently", () => {
    const storage = new MemoryStorage();
    const raw = createDefaultGameSave() as unknown as Record<string, unknown>;
    const state = raw.state as Record<string, unknown>;
    state.wcXp = -1;
    state.character = { name: " ".repeat(3) };
    state.gold = 42;
    state.tools = { bronzeAxe: true, ironAxe: "yes" };
    state.inventory = { tree: 3, rock: -2 };
    state.playableCore = {
      mastery: 4,
      trainingXp: Number.NaN,
      completedCycles: 5,
      cycleProgress: 100,
      refinedTechniqueOwned: true,
      steadyRoutineOwned: "yes",
      firstTrialCompleted: "yes",
    };
    raw.selections = { woodcutting: "oak", mining: "unknown" };
    raw.activeActivity = {
      skill: "woodcutting",
      resourceId: "unknown",
      startedAt: 10,
    };
    storage.setItem(GAME_SAVE_KEY, JSON.stringify(raw));

    const result = loadGameSave(storage);

    expect(result.source).toBe("canonical");
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.save.state.wcXp).toBe(0);
    expect(result.save.state.character).toEqual({ name: "Trainee" });
    expect(result.save.state.gold).toBe(42);
    expect(result.save.state.tools.bronzeAxe).toBe(true);
    expect(result.save.state.tools.ironAxe).toBe(false);
    expect(result.save.state.inventory).toEqual({ tree: 3 });
    expect(result.save.state.playableCore.mastery).toBe(4);
    expect(result.save.state.playableCore.trainingXp).toBe(0);
    expect(result.save.state.playableCore.completedCycles).toBe(5);
    expect(result.save.state.playableCore.cycleProgress).toBe(0);
    expect(result.save.state.playableCore.refinedTechniqueOwned).toBe(true);
    expect(result.save.state.playableCore.steadyRoutineOwned).toBe(false);
    expect(result.save.state.playableCore.firstTrialCompleted).toBe(false);
    expect(result.save.selections).toEqual({
      woodcutting: "oak",
      mining: "rock",
    });
    expect(result.save.activeActivity).toBeNull();
  });

  it("preserves malformed canonical text before recovering defaults", () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_SAVE_KEY, "{not-json");
    storage.setItem("gold", "999");

    const result = loadGameSave(storage);

    expect(result.source).toBe("recovered");
    expect(result.save).toEqual(createDefaultGameSave());
    expect(storage.getItem(GAME_SAVE_RECOVERY_KEY)).toBe("{not-json");
    expect(JSON.parse(storage.getItem(GAME_SAVE_KEY)!)).toEqual(result.save);
  });

  it("does not interpret an unsupported version as version 1", () => {
    const storage = new MemoryStorage();
    const unsupported = JSON.stringify({
      version: 999,
      state: { gold: 500 },
    });
    storage.setItem(GAME_SAVE_KEY, unsupported);

    const result = loadGameSave(storage);

    expect(result.source).toBe("recovered");
    expect(result.save).toEqual(createDefaultGameSave());
    expect(storage.getItem(GAME_SAVE_RECOVERY_KEY)).toBe(unsupported);
  });

  it("prefers canonical data over stale legacy keys", () => {
    const storage = new MemoryStorage();
    const save = createDefaultGameSave();
    save.state.gold = 5;
    saveGameSave(storage, save);
    storage.setItem("gold", "999");

    expect(loadGameSave(storage).save.state.gold).toBe(5);
  });

  it("clears only IdleGame-owned storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_SAVE_KEY, "save");
    storage.setItem(GAME_SAVE_RECOVERY_KEY, "recovery");
    for (const key of LEGACY_GAME_KEYS) storage.setItem(key, "legacy");
    storage.setItem("unrelated.application", "keep-me");

    clearGameStorage(storage);

    expect(storage.getItem(GAME_SAVE_KEY)).toBeNull();
    expect(storage.getItem(GAME_SAVE_RECOVERY_KEY)).toBeNull();
    for (const key of LEGACY_GAME_KEYS) {
      expect(storage.getItem(key)).toBeNull();
    }
    expect(storage.getItem("unrelated.application")).toBe("keep-me");
  });
});
