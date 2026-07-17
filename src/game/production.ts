export const PRODUCTION_PROGRESS_MAX = 100;
export const PRODUCTION_BASE_STEP_MS = 50;

export interface ProductionResult {
  completedItems: number;
  progress: number;
}

function isValidProgress(progress: number): boolean {
  return (
    Number.isFinite(progress) &&
    progress >= 0 &&
    progress < PRODUCTION_PROGRESS_MAX
  );
}

export function calculateElapsedProduction(
  speed: number,
  elapsedMs: number,
  startingProgress = 0
): ProductionResult {
  if (
    !Number.isFinite(speed) ||
    speed <= 0 ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    !isValidProgress(startingProgress)
  ) {
    return {
      completedItems: 0,
      progress: isValidProgress(startingProgress) ? startingProgress : 0,
    };
  }

  const earnedProgress =
    (elapsedMs / PRODUCTION_BASE_STEP_MS) * speed;
  const totalProgress = startingProgress + earnedProgress;
  const boundaryTolerance = 1e-9;
  const completedItems = Math.floor(
    (totalProgress + boundaryTolerance) / PRODUCTION_PROGRESS_MAX
  );

  if (!Number.isSafeInteger(completedItems)) {
    return { completedItems: 0, progress: startingProgress };
  }

  const rawProgress =
    totalProgress - completedItems * PRODUCTION_PROGRESS_MAX;
  const progress = Math.abs(rawProgress) < boundaryTolerance ? 0 : rawProgress;

  if (!isValidProgress(progress)) {
    return { completedItems: 0, progress: startingProgress };
  }

  return { completedItems, progress };
}

export function progressToElapsedMs(speed: number, progress: number): number {
  if (
    !Number.isFinite(speed) ||
    speed <= 0 ||
    !isValidProgress(progress)
  ) {
    return 0;
  }

  return (progress / speed) * PRODUCTION_BASE_STEP_MS;
}
