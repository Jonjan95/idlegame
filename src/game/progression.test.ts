import { describe, expect, it } from "vitest";
import {
  describeResourceLock,
  getResourceLock,
} from "./progression";
import {
  DEFAULT_TOOLS,
  ROCKS,
  TREES,
  type Resource,
  type Tools,
} from "../lib/resources";

function toolsWith(overrides: Partial<Tools> = {}): Tools {
  return {
    ...DEFAULT_TOOLS,
    ...overrides,
  };
}

describe("resource unlock progression", () => {
  it("leaves starter resources unlocked", () => {
    expect(getResourceLock(TREES[0], toolsWith(), 1)).toBeNull();
    expect(getResourceLock(ROCKS[0], toolsWith(), 1)).toBeNull();
  });

  it("locks a resource below its required level", () => {
    expect(getResourceLock(TREES[1], toolsWith(), 14)).toEqual({
      type: "level",
      requiredLevel: 15,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5])(
    "treats invalid level %s as below the requirement",
    (level) => {
      expect(getResourceLock(TREES[0], toolsWith(), level)).toEqual({
        type: "level",
        requiredLevel: 1,
      });
    }
  );

  it("evaluates the tool requirement at the exact level boundary", () => {
    expect(getResourceLock(TREES[1], toolsWith(), 15)).toEqual({
      type: "tool",
      toolId: "bronzeAxe",
    });
  });

  it("unlocks a resource when level and tool requirements are met", () => {
    expect(
      getResourceLock(
        TREES[1],
        toolsWith({ bronzeAxe: true }),
        TREES[1].levelReq
      )
    ).toBeNull();
  });

  it("prioritizes a missing level over a missing tool", () => {
    expect(getResourceLock(ROCKS[2], toolsWith(), 1)).toEqual({
      type: "level",
      requiredLevel: 25,
    });
  });

  it("describes level and tool locks for the UI", () => {
    expect(
      describeResourceLock({ type: "level", requiredLevel: 10 })
    ).toBe("Requires level 10");
    expect(
      describeResourceLock({ type: "tool", toolId: "bronzePickaxe" })
    ).toBe("Requires Bronze Pickaxe");
    expect(describeResourceLock(null)).toBeNull();
  });

  it("supports any resource configuration with the same requirements", () => {
    const provisionalResource = {
      levelReq: 3,
      toolReq: null,
    } satisfies Pick<Resource, "levelReq" | "toolReq">;

    expect(getResourceLock(provisionalResource, toolsWith(), 2)).toEqual({
      type: "level",
      requiredLevel: 3,
    });
  });
});
