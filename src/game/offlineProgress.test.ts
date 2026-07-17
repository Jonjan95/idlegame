import { describe, expect, it } from "vitest";
import {
  OFFLINE_PROGRESS_CONFIG,
  calculateOfflineProduction,
} from "./offlineProgress";
import { calculateElapsedProduction } from "./production";

const NOW = 1_750_000_000_000;
const CAP = OFFLINE_PROGRESS_CONFIG.gatheringMaxElapsedMs;

describe("offline gathering production", () => {
  it("matches elapsed production below the cap", () => {
    const elapsedMs = 6_250;
    const result = calculateOfflineProduction(2, NOW - elapsedMs, NOW);

    expect(result).toMatchObject({
      ...calculateElapsedProduction(2, elapsedMs),
      accountedElapsedMs: elapsedMs,
      capApplied: false,
      clockAnomaly: false,
    });
  });

  it("accounts for the exact cap without reporting truncation", () => {
    const result = calculateOfflineProduction(2, NOW - CAP, NOW);

    expect(result.accountedElapsedMs).toBe(CAP);
    expect(result.capApplied).toBe(false);
    expect(result.completedItems).toBe(11_520);
    expect(result.progress).toBe(0);
  });

  it("truncates elapsed time above the cap", () => {
    const result = calculateOfflineProduction(2, NOW - CAP - 60_000, NOW);

    expect(result.accountedElapsedMs).toBe(CAP);
    expect(result.capApplied).toBe(true);
    expect(result.completedItems).toBe(11_520);
    expect(result.accountingStartedAt).toBe(NOW);
  });

  it("retains fractional progress in the next accounting boundary", () => {
    const result = calculateOfflineProduction(2, NOW - 1_250, NOW);

    expect(result.completedItems).toBe(0);
    expect(result.progress).toBe(50);
    expect(result.accountingStartedAt).toBe(NOW - 1_250);
  });

  it("does not duplicate completed work on an immediate second calculation", () => {
    const first = calculateOfflineProduction(2, NOW - 6_250, NOW);
    const second = calculateOfflineProduction(
      2,
      first.accountingStartedAt,
      NOW
    );

    expect(first).toMatchObject({ completedItems: 2, progress: 50 });
    expect(second).toMatchObject({ completedItems: 0, progress: 50 });
  });

  it("treats a future timestamp as a clock anomaly with no reward", () => {
    expect(calculateOfflineProduction(2, NOW + 1, NOW)).toEqual({
      completedItems: 0,
      progress: 0,
      accountedElapsedMs: 0,
      accountingStartedAt: NOW,
      capApplied: false,
      clockAnomaly: true,
    });
  });

  it.each([
    [0, NOW - 1_000, NOW, CAP],
    [2, Number.NaN, NOW, CAP],
    [2, NOW - 1_000, Number.NaN, CAP],
    [2, NOW - 1_000, NOW, -1],
  ])(
    "safely rejects invalid speed or time input",
    (speed, startedAt, now, maxElapsedMs) => {
      const result = calculateOfflineProduction(
        speed,
        startedAt,
        now,
        maxElapsedMs
      );

      expect(result.completedItems).toBe(0);
      expect(result.progress).toBe(0);
    }
  );
});
