import {
  calculateElapsedProduction,
  progressToElapsedMs,
  type ProductionResult,
} from "./production";

export const OFFLINE_PROGRESS_CONFIG = {
  gatheringMaxElapsedMs: 8 * 60 * 60 * 1_000,
} as const;

export interface OfflineProductionResult extends ProductionResult {
  accountedElapsedMs: number;
  accountingStartedAt: number;
  capApplied: boolean;
  clockAnomaly: boolean;
}

function emptyResult(now: number, clockAnomaly: boolean): OfflineProductionResult {
  return {
    completedItems: 0,
    progress: 0,
    accountedElapsedMs: 0,
    accountingStartedAt: Number.isSafeInteger(now) && now > 0 ? now : 0,
    capApplied: false,
    clockAnomaly,
  };
}

export function calculateOfflineProduction(
  speed: number,
  startedAt: number,
  now: number,
  maxElapsedMs = OFFLINE_PROGRESS_CONFIG.gatheringMaxElapsedMs
): OfflineProductionResult {
  if (
    !Number.isSafeInteger(startedAt) ||
    startedAt <= 0 ||
    !Number.isSafeInteger(now) ||
    now <= 0 ||
    !Number.isSafeInteger(maxElapsedMs) ||
    maxElapsedMs < 0 ||
    startedAt > now
  ) {
    return emptyResult(now, startedAt > now);
  }

  const elapsedMs = now - startedAt;
  const accountedElapsedMs = Math.min(elapsedMs, maxElapsedMs);
  const capApplied = elapsedMs > maxElapsedMs;
  const production = calculateElapsedProduction(speed, accountedElapsedMs);
  const remainingElapsedMs = progressToElapsedMs(speed, production.progress);

  return {
    ...production,
    accountedElapsedMs,
    accountingStartedAt: Math.max(1, Math.round(now - remainingElapsedMs)),
    capApplied,
    clockAnomaly: false,
  };
}
