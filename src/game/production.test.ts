import { describe, expect, it } from "vitest";
import {
  PRODUCTION_BASE_STEP_MS,
  calculateElapsedProduction,
  progressToElapsedMs,
} from "./production";
import { ROCKS, TREES } from "../lib/resources";

const RESOURCES = [...TREES, ...ROCKS];

function durationMs(speed: number): number {
  return (100 / speed) * PRODUCTION_BASE_STEP_MS;
}

describe("elapsed production", () => {
  it.each(RESOURCES.map((resource) => [resource.name, resource.speed] as const))(
    "completes %s at its exact configured duration",
    (_name, speed) => {
      expect(calculateElapsedProduction(speed, durationMs(speed))).toEqual({
        completedItems: 1,
        progress: 0,
      });
    }
  );

  it("retains fractional progress below a boundary", () => {
    expect(calculateElapsedProduction(2, 1_250)).toEqual({
      completedItems: 0,
      progress: 50,
    });
  });

  it("combines starting progress with new elapsed time", () => {
    expect(calculateElapsedProduction(2, 1_250, 50)).toEqual({
      completedItems: 1,
      progress: 0,
    });
  });

  it("completes multiple items and retains the remainder", () => {
    expect(calculateElapsedProduction(2, 6_250)).toEqual({
      completedItems: 2,
      progress: 50,
    });
  });

  it("produces the same result across callback subdivisions", () => {
    const single = calculateElapsedProduction(1.5, 10_000);
    let progress = 0;
    let completedItems = 0;

    for (const elapsedMs of [750, 1_250, 3_000, 2_000, 3_000]) {
      const result = calculateElapsedProduction(1.5, elapsedMs, progress);
      completedItems += result.completedItems;
      progress = result.progress;
    }

    expect(completedItems).toBe(single.completedItems);
    expect(progress).toBeCloseTo(single.progress, 10);
  });

  it.each([
    [0, 100, 0],
    [-1, 100, 0],
    [Number.NaN, 100, 0],
    [2, -1, 0],
    [2, Number.POSITIVE_INFINITY, 0],
    [2, 100, -1],
    [2, 100, 100],
  ])(
    "rejects invalid speed, elapsed time, or progress",
    (speed, elapsedMs, startingProgress) => {
      expect(
        calculateElapsedProduction(speed, elapsedMs, startingProgress)
          .completedItems
      ).toBe(0);
    }
  );

  it("converts remaining progress back to elapsed time", () => {
    expect(progressToElapsedMs(2, 50)).toBe(1_250);
    expect(progressToElapsedMs(0, 50)).toBe(0);
  });

  it.each(RESOURCES.map((resource) => [resource.name, resource.speed] as const))(
    "round-trips fractional %s progress through elapsed time",
    (_name, speed) => {
      const elapsedMs = progressToElapsedMs(speed, 37.5);
      const result = calculateElapsedProduction(speed, elapsedMs);

      expect(result.completedItems).toBe(0);
      expect(result.progress).toBeCloseTo(37.5, 10);
    }
  );
});
