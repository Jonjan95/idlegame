import type { GameState, SkillName } from "./state";
import type { ShopTool } from "../lib/resources";

export interface ResourceAward {
  skill: SkillName;
  resourceId: string;
  quantity: number;
  xpPerItem: number;
}

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function canAddSafely(current: number, amount: number): boolean {
  return Number.isSafeInteger(current + amount) && current + amount >= 0;
}

export function awardResource(
  state: GameState,
  award: ResourceAward
): GameState {
  if (
    award.resourceId.trim().length === 0 ||
    !isPositiveInteger(award.quantity) ||
    !Number.isSafeInteger(award.xpPerItem) ||
    award.xpPerItem < 0
  ) {
    return state;
  }

  const xpAward = award.quantity * award.xpPerItem;
  const currentInventory = state.inventory[award.resourceId] || 0;

  if (
    !Number.isSafeInteger(xpAward) ||
    !canAddSafely(currentInventory, award.quantity)
  ) {
    return state;
  }

  if (award.skill === "woodcutting") {
    if (
      !canAddSafely(state.wcXp, xpAward) ||
      !canAddSafely(state.wcLogs, award.quantity)
    ) {
      return state;
    }

    return {
      ...state,
      wcXp: state.wcXp + xpAward,
      wcLogs: state.wcLogs + award.quantity,
      inventory: {
        ...state.inventory,
        [award.resourceId]: currentInventory + award.quantity,
      },
    };
  }

  if (
    !canAddSafely(state.miningXp, xpAward) ||
    !canAddSafely(state.miningOres, award.quantity)
  ) {
    return state;
  }

  return {
    ...state,
    miningXp: state.miningXp + xpAward,
    miningOres: state.miningOres + award.quantity,
    inventory: {
      ...state.inventory,
      [award.resourceId]: currentInventory + award.quantity,
    },
  };
}

export function purchaseTool(
  state: GameState,
  tool: Pick<ShopTool, "id" | "cost">
): GameState {
  if (
    !isPositiveInteger(tool.cost) ||
    state.gold < tool.cost ||
    state.tools[tool.id]
  ) {
    return state;
  }

  return {
    ...state,
    gold: state.gold - tool.cost,
    tools: {
      ...state.tools,
      [tool.id]: true,
    },
  };
}

export function sellInventoryItem(
  state: GameState,
  itemId: string,
  amount: number,
  goldPerItem: number
): GameState {
  if (
    itemId.trim().length === 0 ||
    !isPositiveInteger(amount) ||
    !isPositiveInteger(goldPerItem)
  ) {
    return state;
  }

  const currentQuantity = state.inventory[itemId] || 0;
  if (!isPositiveInteger(currentQuantity)) return state;

  const quantitySold = Math.min(currentQuantity, amount);
  const goldEarned = quantitySold * goldPerItem;

  if (
    !Number.isSafeInteger(goldEarned) ||
    !canAddSafely(state.gold, goldEarned)
  ) {
    return state;
  }

  return {
    ...state,
    gold: state.gold + goldEarned,
    inventory: {
      ...state.inventory,
      [itemId]: currentQuantity - quantitySold,
    },
  };
}

export function grantGold(state: GameState, amount: number): GameState {
  if (!isPositiveInteger(amount) || !canAddSafely(state.gold, amount)) {
    return state;
  }

  return {
    ...state,
    gold: state.gold + amount,
  };
}
