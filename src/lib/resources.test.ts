import { describe, expect, it } from "vitest";
import { ROCKS, SHOP_TOOLS, TREES } from "./resources";

const RESOURCES = [...TREES, ...ROCKS];

describe("resource configuration", () => {
  it("uses unique resource and tool identifiers", () => {
    const resourceIds = RESOURCES.map((resource) => resource.id);
    const toolIds = SHOP_TOOLS.map((tool) => tool.id);

    expect(new Set(resourceIds).size).toBe(resourceIds.length);
    expect(new Set(toolIds).size).toBe(toolIds.length);
  });

  it("uses positive economy and progression values", () => {
    for (const resource of RESOURCES) {
      expect(resource.xpPerItem).toBeGreaterThan(0);
      expect(resource.speed).toBeGreaterThan(0);
      expect(resource.goldPer).toBeGreaterThan(0);
    }

    for (const tool of SHOP_TOOLS) {
      expect(tool.cost).toBeGreaterThan(0);
    }
  });

  it("references only configured tools", () => {
    const toolIds = new Set(SHOP_TOOLS.map((tool) => tool.id));

    for (const resource of RESOURCES) {
      if (resource.toolReq) {
        expect(toolIds.has(resource.toolReq)).toBe(true);
      }
    }
  });
});
