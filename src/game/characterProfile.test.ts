import { describe, expect, it } from "vitest";
import {
  createDefaultCharacterProfile,
  getCharacterProgressSummary,
  normalizeCharacterName,
  renameCharacter,
} from "./characterProfile";
import { CHARACTER_PROFILE_CONFIG } from "./characterProfileConfig";
import { createDefaultGameState } from "./state";

describe("character profile", () => {
  it("creates an isolated neutral default profile", () => {
    const first = createDefaultCharacterProfile();
    const second = createDefaultCharacterProfile();

    first.name = "Changed";

    expect(second).toEqual({ name: CHARACTER_PROFILE_CONFIG.defaultName });
    expect(first).not.toBe(second);
  });

  it("normalizes valid display names", () => {
    expect(normalizeCharacterName("  Mira   Stone  ")).toEqual({
      accepted: true,
      name: "Mira Stone",
    });
  });

  it("rejects empty and overlong display names", () => {
    expect(normalizeCharacterName("   ")).toEqual({
      accepted: false,
      issue: "empty",
    });
    expect(
      normalizeCharacterName(
        "x".repeat(CHARACTER_PROFILE_CONFIG.maximumNameLength + 1)
      )
    ).toEqual({ accepted: false, issue: "too_long" });
  });

  it("renames immutably and preserves state after rejected input", () => {
    const state = createDefaultGameState();
    const renamed = renameCharacter(state, "  Mira   Stone  ");
    const rejected = renameCharacter(renamed.state, " ");

    expect(renamed.result).toEqual({ accepted: true, name: "Mira Stone" });
    expect(renamed.state).not.toBe(state);
    expect(renamed.state.character).not.toBe(state.character);
    expect(renamed.state.character.name).toBe("Mira Stone");
    expect(state.character.name).toBe(CHARACTER_PROFILE_CONFIG.defaultName);
    expect(rejected.state).toBe(renamed.state);
  });

  it("derives visible growth only from existing progression", () => {
    const state = createDefaultGameState();
    state.character.name = "Mira";
    state.playableCore.trainingXp = 400;

    expect(getCharacterProgressSummary(state)).toMatchObject({
      name: "Mira",
      initial: "M",
      trainingLevel: 3,
      trainingXp: 400,
      stage: "training",
      stageLabel: "Training in progress",
      firstTrialCompleted: false,
      nextObjective: "Attempt the First Trial",
    });

    state.playableCore.firstTrialCompleted = true;

    expect(getCharacterProgressSummary(state)).toMatchObject({
      stage: "trial_proven",
      stageLabel: "Trial proven",
      firstTrialCompleted: true,
      nextObjective: "Reach Training Level 4",
    });
  });
});
