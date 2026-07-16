import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { TREES, ROCKS, SHOP_TOOLS, ToolKey, Resource } from "../lib/resources";
import {
  createDefaultGameState,
  createDefaultResourceSelections,
  type GameState,
  type SkillName,
} from "../game/state";

export type { GameState, SkillName } from "../game/state";

function getResource(skill: SkillName, selectedId: string): Resource {
  const list = skill === "woodcutting" ? TREES : ROCKS;
  return list.find((r) => r.id === selectedId) ?? list[0];
}

function secsPerItem(resource: Resource): number {
  return (100 / resource.speed) * 0.05;
}

export interface Toast {
  id: number;
  icon: string;
  text: string;
}

interface GameContextValue {
  state: GameState;
  activeSkill: SkillName | null;
  progress: number;
  selectedTree: string;
  selectedRock: string;
  toasts: Toast[];
  loaded: boolean;
  startSkill: (skill: SkillName) => void;
  stopSkill: () => void;
  selectResource: (skill: SkillName, resourceId: string) => void;
  buyTool: (toolId: ToolKey) => void;
  sell: (item: "wcLogs" | "miningOres", amount: number, goldPer: number) => void;
  sellItem: (itemId: string, amount: number, goldPer: number) => void;
  addGold: (amount: number) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

function readFromStorage(): GameState {
  const defaults = createDefaultGameState();

  return {
    wcXp: Number(localStorage.getItem("wc_xp")) || 0,
    wcLogs: Number(localStorage.getItem("wc_logs")) || 0,
    miningXp: Number(localStorage.getItem("mining_xp")) || 0,
    miningOres: Number(localStorage.getItem("mining_ores")) || 0,
    gold: Number(localStorage.getItem("gold")) || 0,
    tools: JSON.parse(localStorage.getItem("tools") || "null") ?? defaults.tools,
    inventory: JSON.parse(localStorage.getItem("inventory") || "{}"),
  };
}

function writeToStorage(s: GameState): void {
  localStorage.setItem("wc_xp", String(s.wcXp));
  localStorage.setItem("wc_logs", String(s.wcLogs));
  localStorage.setItem("mining_xp", String(s.miningXp));
  localStorage.setItem("mining_ores", String(s.miningOres));
  localStorage.setItem("gold", String(s.gold));
  localStorage.setItem("tools", JSON.stringify(s.tools));
  localStorage.setItem("inventory", JSON.stringify(s.inventory));
}

let nextToastId = 0;

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createDefaultGameState);
  const [activeSkill, setActiveSkill] = useState<SkillName | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedTree, setSelectedTree] = useState(
    () => createDefaultResourceSelections().woodcutting
  );
  const [selectedRock, setSelectedRock] = useState(
    () => createDefaultResourceSelections().mining
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = readFromStorage();
    const selections = createDefaultResourceSelections();
    const storedTree =
      localStorage.getItem("selected_tree") || selections.woodcutting;
    const storedRock =
      localStorage.getItem("selected_rock") || selections.mining;
    setSelectedTree(storedTree);
    setSelectedRock(storedRock);

    const skill = localStorage.getItem("active_skill") as SkillName | null;
    const startTime = Number(localStorage.getItem("active_skill_start")) || 0;
    const final = { ...saved };

    if (skill && startTime > 0) {
      const resourceId = skill === "woodcutting" ? storedTree : storedRock;
      const resource = getResource(skill, resourceId);
      const elapsed = (Date.now() - startTime) / 1000;
      const items = Math.floor(elapsed / secsPerItem(resource));
      const xp = items * resource.xpPerItem;

      if (skill === "woodcutting") { final.wcXp += xp; final.wcLogs += items; }
      else { final.miningXp += xp; final.miningOres += items; }

      final.inventory = { ...final.inventory };
      final.inventory[resourceId] = (final.inventory[resourceId] || 0) + items;

      writeToStorage(final);
      localStorage.setItem("active_skill_start", String(Date.now()));
      setActiveSkill(skill);

      if (items > 0) {
        pushToast(
          skill === "woodcutting" ? "🪵" : "🪨",
          `+${items} ${resource.name} (offline)`
        );
      }
    }

    setState(final);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeToStorage(state);
  }, [state, loaded]);

  useEffect(() => {
    if (!activeSkill) return;
    const resourceId = activeSkill === "woodcutting" ? selectedTree : selectedRock;
    const resource = getResource(activeSkill, resourceId);
    const { speed, xpPerItem } = resource;
    const itemIcon = activeSkill === "woodcutting" ? "🪵" : "🪨";

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + speed;
        if (next >= 100) {
          setState((s) => {
            const newState = { ...s, inventory: { ...s.inventory } };
            newState.inventory[resourceId] = (newState.inventory[resourceId] || 0) + 1;
            if (activeSkill === "woodcutting") { newState.wcXp += xpPerItem; newState.wcLogs += 1; }
            else { newState.miningXp += xpPerItem; newState.miningOres += 1; }
            return newState;
          });
          pushToast(itemIcon, `+1 ${resource.name}`);
          return 0;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeSkill, selectedTree, selectedRock]);

  function pushToast(icon: string, text: string) {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, icon, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  function startSkill(skill: SkillName) {
    setProgress(0);
    setActiveSkill(skill);
    localStorage.setItem("active_skill", skill);
    localStorage.setItem("active_skill_start", String(Date.now()));
  }

  function stopSkill() {
    setProgress(0);
    setActiveSkill(null);
    localStorage.removeItem("active_skill");
    localStorage.removeItem("active_skill_start");
  }

  function selectResource(skill: SkillName, resourceId: string) {
    setProgress(0);
    if (skill === "woodcutting") {
      setSelectedTree(resourceId);
      localStorage.setItem("selected_tree", resourceId);
    } else {
      setSelectedRock(resourceId);
      localStorage.setItem("selected_rock", resourceId);
    }
  }

  function buyTool(toolId: ToolKey) {
    const tool = SHOP_TOOLS.find((t) => t.id === toolId);
    if (!tool) return;
    setState((s) => {
      if (s.gold < tool.cost || s.tools[toolId]) return s;
      return { ...s, gold: s.gold - tool.cost, tools: { ...s.tools, [toolId]: true } };
    });
  }

  function sell(item: "wcLogs" | "miningOres", amount: number, goldPer: number) {
    setState((s) => {
      const qty = Math.min(s[item], amount);
      return { ...s, [item]: s[item] - qty, gold: s.gold + qty * goldPer };
    });
  }

  function sellItem(itemId: string, amount: number, goldPer: number) {
    setState((s) => {
      const currentQty = s.inventory[itemId] || 0;
      if (currentQty <= 0) return s;
      const qty = Math.min(currentQty, amount);
      return {
        ...s,
        inventory: { ...s.inventory, [itemId]: currentQty - qty },
        gold: s.gold + qty * goldPer,
      };
    });
  }

  function addGold(amount: number) {
    setState((s) => ({ ...s, gold: s.gold + amount }));
  }

  return (
    <GameContext.Provider value={{
      state, activeSkill, progress, selectedTree, selectedRock, toasts, loaded,
      startSkill, stopSkill, selectResource, buyTool, sell, sellItem, addGold,
    }}>
      {children}
    </GameContext.Provider>
  );
}
