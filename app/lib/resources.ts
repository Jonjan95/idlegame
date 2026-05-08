export type ToolKey = "bronzeAxe" | "ironAxe" | "bronzePickaxe" | "ironPickaxe";

export interface Tools {
  bronzeAxe: boolean;
  ironAxe: boolean;
  bronzePickaxe: boolean;
  ironPickaxe: boolean;
}

export const DEFAULT_TOOLS: Tools = {
  bronzeAxe: false,
  ironAxe: false,
  bronzePickaxe: false,
  ironPickaxe: false,
};

export type ItemKey =
  | "wcLogs" | "wcOakLogs" | "wcWillowLogs"
  | "miningOres" | "miningCopperOres" | "miningIronOres";

export interface Resource {
  id: string;
  name: string;
  icon: string;
  xpPerItem: number;
  speed: number;
  toolReq: ToolKey | null;
  itemKey: ItemKey;
  goldPer: number;
}

export const TREES: Resource[] = [
  { id: "tree",   name: "Tree",   icon: "🌲", xpPerItem: 25,  speed: 2,   toolReq: null,         itemKey: "wcLogs",         goldPer: 2  },
  { id: "oak",    name: "Oak",    icon: "🌳", xpPerItem: 60,  speed: 1.5, toolReq: "bronzeAxe",  itemKey: "wcOakLogs",      goldPer: 8  },
  { id: "willow", name: "Willow", icon: "🌿", xpPerItem: 110, speed: 1,   toolReq: "ironAxe",    itemKey: "wcWillowLogs",   goldPer: 18 },
];

export const ROCKS: Resource[] = [
  { id: "rock",   name: "Rock",   icon: "🪨", xpPerItem: 35,  speed: 1.5, toolReq: null,              itemKey: "miningOres",        goldPer: 5  },
  { id: "copper", name: "Copper", icon: "🟤", xpPerItem: 70,  speed: 1.2, toolReq: "bronzePickaxe",   itemKey: "miningCopperOres",  goldPer: 15 },
  { id: "iron",   name: "Iron",   icon: "⚙️",  xpPerItem: 130, speed: 0.8, toolReq: "ironPickaxe",     itemKey: "miningIronOres",    goldPer: 30 },
];

export interface ShopTool {
  id: ToolKey;
  name: string;
  icon: string;
  cost: number;
  unlocks: string;
  skill: "woodcutting" | "mining";
}

export const SHOP_TOOLS: ShopTool[] = [
  { id: "bronzeAxe",      name: "Bronze Axe",      icon: "🪓", cost: 200,  unlocks: "Oak trees",    skill: "woodcutting" },
  { id: "ironAxe",        name: "Iron Axe",         icon: "🪓", cost: 1000, unlocks: "Willow trees", skill: "woodcutting" },
  { id: "bronzePickaxe",  name: "Bronze Pickaxe",   icon: "⛏️", cost: 200,  unlocks: "Copper rocks", skill: "mining" },
  { id: "ironPickaxe",    name: "Iron Pickaxe",     icon: "⛏️", cost: 1000, unlocks: "Iron rocks",   skill: "mining" },
];
