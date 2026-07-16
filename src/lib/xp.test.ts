import { describe, expect, it } from "vitest";
import {
  levelProgressPercent,
  xpForLevel,
  xpInCurrentLevel,
  xpNeededForNextLevel,
  xpToLevel,
} from "./xp";

describe("XP progression", () => {
  it.each([
    [1, 0],
    [2, 100],
    [3, 400],
    [5, 1600],
    [10, 8100],
  ])("level %i requires %i XP", (level, xp) => {
    expect(xpForLevel(level)).toBe(xp);
  });

  it.each([1, 2, 5, 10, 20, 50, 99])(
    "round-trips the threshold for level %i",
    (level) => {
      expect(xpToLevel(xpForLevel(level))).toBe(level);
    }
  );

  it("keeps XP below a threshold in the current level", () => {
    expect(xpToLevel(99)).toBe(1);
    expect(xpToLevel(399)).toBe(2);
  });

  it("calculates progress within the current level", () => {
    expect(xpInCurrentLevel(250)).toBe(150);
    expect(xpNeededForNextLevel(250)).toBe(300);
    expect(levelProgressPercent(250)).toBe(50);
  });

  it("starts a new level at zero percent progress", () => {
    expect(levelProgressPercent(xpForLevel(5))).toBe(0);
  });
});
