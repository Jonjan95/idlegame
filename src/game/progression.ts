import {
  SHOP_TOOLS,
  type Resource,
  type ToolKey,
  type Tools,
} from "../lib/resources";

export type ResourceLock =
  | {
      type: "level";
      requiredLevel: number;
    }
  | {
      type: "tool";
      toolId: ToolKey;
    };

export function getResourceLock(
  resource: Pick<Resource, "levelReq" | "toolReq">,
  tools: Tools,
  level: number
): ResourceLock | null {
  const currentLevel =
    Number.isSafeInteger(level) && level >= 1 ? level : 0;

  if (currentLevel < resource.levelReq) {
    return {
      type: "level",
      requiredLevel: resource.levelReq,
    };
  }

  if (resource.toolReq && !tools[resource.toolReq]) {
    return {
      type: "tool",
      toolId: resource.toolReq,
    };
  }

  return null;
}

export function describeResourceLock(lock: ResourceLock | null): string | null {
  if (!lock) return null;

  if (lock.type === "level") {
    return `Requires level ${lock.requiredLevel}`;
  }

  const tool = SHOP_TOOLS.find((candidate) => candidate.id === lock.toolId);
  return `Requires ${tool?.name ?? lock.toolId}`;
}
