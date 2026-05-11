export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpInCurrentLevel(xp: number): number {
  return xp - xpForLevel(xpToLevel(xp));
}

export function xpNeededForNextLevel(xp: number): number {
  const level = xpToLevel(xp);
  return xpForLevel(level + 1) - xpForLevel(level);
}

export function levelProgressPercent(xp: number): number {
  return (xpInCurrentLevel(xp) / xpNeededForNextLevel(xp)) * 100;
}
