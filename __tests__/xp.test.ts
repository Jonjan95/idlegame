import {
  xpForLevel,
  xpToLevel,
  xpInCurrentLevel,
  xpNeededForNextLevel,
  levelProgressPercent,
} from "../app/lib/xp";

describe("xpForLevel", () => {
  it("level 1 requires 0 XP", () => expect(xpForLevel(1)).toBe(0));
  it("level 2 requires 100 XP", () => expect(xpForLevel(2)).toBe(100));
  it("level 5 requires 1600 XP", () => expect(xpForLevel(5)).toBe(1600));
  it("level 10 requires 8100 XP", () => expect(xpForLevel(10)).toBe(8100));

  it("returns 0 for level 1 (lowest valid)", () => expect(xpForLevel(1)).toBe(0));
  it("grows quadratically (level 3 = 4x level 2)", () =>
    expect(xpForLevel(3)).toBe(400));
});

describe("xpToLevel", () => {
  it("0 XP gives level 1", () => expect(xpToLevel(0)).toBe(1));
  it("99 XP still gives level 1 (below threshold)", () =>
    expect(xpToLevel(99)).toBe(1));
  it("100 XP gives level 2", () => expect(xpToLevel(100)).toBe(2));
  it("399 XP gives level 2 (below next threshold)", () =>
    expect(xpToLevel(399)).toBe(2));
  it("400 XP gives level 3", () => expect(xpToLevel(400)).toBe(3));
});

describe("xpToLevel(xpForLevel(n)) === n (roundtrip)", () => {
  [1, 2, 5, 10, 20, 50, 99].forEach((level) => {
    it(`level ${level}`, () =>
      expect(xpToLevel(xpForLevel(level))).toBe(level));
  });
});

describe("xpInCurrentLevel", () => {
  it("0 XP → 0 XP in current level", () =>
    expect(xpInCurrentLevel(0)).toBe(0));

  it("150 XP (level 2, needs 100 for L2) → 50 XP in level", () =>
    expect(xpInCurrentLevel(150)).toBe(50));

  it("exactly at level boundary → 0 XP in level", () =>
    expect(xpInCurrentLevel(100)).toBe(0));
});

describe("levelProgressPercent", () => {
  it("0 XP → 0%", () => expect(levelProgressPercent(0)).toBe(0));

  it("halfway through level 2 → 50%", () => {
    expect(levelProgressPercent(250)).toBe(50);
  });

  it("returns a value between 0 and 100", () => {
    const percent = levelProgressPercent(500);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });
});
