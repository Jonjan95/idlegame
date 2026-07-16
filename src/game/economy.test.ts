import { describe, expect, it } from "vitest";
import {
  awardResource,
  grantGold,
  purchaseTool,
  sellInventoryItem,
} from "./economy";
import { createDefaultGameState } from "./state";
import { SHOP_TOOLS } from "../lib/resources";

const bronzeAxe = SHOP_TOOLS.find((tool) => tool.id === "bronzeAxe")!;

describe("resource awards", () => {
  it("awards woodcutting inventory, XP, and lifetime production", () => {
    const state = createDefaultGameState();
    const result = awardResource(state, {
      skill: "woodcutting",
      resourceId: "tree",
      quantity: 1,
      xpPerItem: 25,
    });

    expect(result.inventory.tree).toBe(1);
    expect(result.wcXp).toBe(25);
    expect(result.wcLogs).toBe(1);
    expect(result.miningXp).toBe(0);
    expect(state).toEqual(createDefaultGameState());
  });

  it("awards multiple mining items deterministically", () => {
    const state = createDefaultGameState();
    const result = awardResource(state, {
      skill: "mining",
      resourceId: "rock",
      quantity: 3,
      xpPerItem: 35,
    });

    expect(result.inventory.rock).toBe(3);
    expect(result.miningXp).toBe(105);
    expect(result.miningOres).toBe(3);
    expect(result.wcXp).toBe(0);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "rejects invalid reward quantity %s",
    (quantity) => {
      const state = createDefaultGameState();

      expect(
        awardResource(state, {
          skill: "woodcutting",
          resourceId: "tree",
          quantity,
          xpPerItem: 25,
        })
      ).toBe(state);
    }
  );
});

describe("tool purchases", () => {
  it("deducts gold and records ownership", () => {
    const state = { ...createDefaultGameState(), gold: bronzeAxe.cost };
    const result = purchaseTool(state, bronzeAxe);

    expect(result.gold).toBe(0);
    expect(result.tools.bronzeAxe).toBe(true);
    expect(state.tools.bronzeAxe).toBe(false);
  });

  it("rejects insufficient funds and duplicate ownership", () => {
    const poorState = createDefaultGameState();
    expect(purchaseTool(poorState, bronzeAxe)).toBe(poorState);

    const ownedState = {
      ...createDefaultGameState(),
      gold: bronzeAxe.cost * 2,
      tools: {
        ...createDefaultGameState().tools,
        bronzeAxe: true,
      },
    };
    expect(purchaseTool(ownedState, bronzeAxe)).toBe(ownedState);
  });

  it("rejects invalid tool costs", () => {
    const state = { ...createDefaultGameState(), gold: 1000 };

    expect(purchaseTool(state, { ...bronzeAxe, cost: 0 })).toBe(state);
  });
});

describe("inventory sales", () => {
  it("sells inventory for gold without mutating the input", () => {
    const state = {
      ...createDefaultGameState(),
      inventory: { tree: 5 },
    };
    const result = sellInventoryItem(state, "tree", 2, 3);

    expect(result.inventory.tree).toBe(3);
    expect(result.gold).toBe(6);
    expect(state.inventory.tree).toBe(5);
  });

  it("clamps a sale to the available quantity", () => {
    const state = {
      ...createDefaultGameState(),
      inventory: { rock: 2 },
    };
    const result = sellInventoryItem(state, "rock", 10, 5);

    expect(result.inventory.rock).toBe(0);
    expect(result.gold).toBe(10);
  });

  it.each([
    ["", 1, 2],
    ["tree", 0, 2],
    ["tree", -1, 2],
    ["tree", 1.5, 2],
    ["tree", 1, 0],
  ] as const)(
    "rejects invalid sale values",
    (itemId, amount, goldPerItem) => {
      const state = {
        ...createDefaultGameState(),
        inventory: { tree: 2 },
      };

      expect(
        sellInventoryItem(state, itemId, amount, goldPerItem)
      ).toBe(state);
    }
  );
});

describe("gold grants", () => {
  it("adds a positive amount without mutating the input", () => {
    const state = createDefaultGameState();
    const result = grantGold(state, 1000);

    expect(result.gold).toBe(1000);
    expect(state.gold).toBe(0);
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY])(
    "rejects invalid grant amount %s",
    (amount) => {
      const state = createDefaultGameState();
      expect(grantGold(state, amount)).toBe(state);
    }
  );
});
