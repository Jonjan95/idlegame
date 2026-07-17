import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { TREES, ROCKS, SHOP_TOOLS, ToolKey, Resource } from "../lib/resources";
import {
  createDefaultGameState,
  createDefaultResourceSelections,
  type GameState,
  type SkillName,
} from "../game/state";
import {
  awardResource,
  grantGold,
  purchaseTool,
  sellInventoryItem,
} from "../game/economy";
import {
  PRODUCTION_BASE_STEP_MS,
  calculateElapsedProduction,
  progressToElapsedMs,
} from "../game/production";
import {
  PLAYABLE_CORE_CONFIG,
  performPractice,
  purchaseRefinedTechnique,
} from "../game/playableCore";

export type { GameState, SkillName } from "../game/state";

function getResource(skill: SkillName, selectedId: string): Resource {
  const list = skill === "woodcutting" ? TREES : ROCKS;
  return list.find((r) => r.id === selectedId) ?? list[0];
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
  sellItem: (itemId: string, amount: number, goldPer: number) => void;
  addGold: (amount: number) => void;
  practice: () => void;
  buyRefinedTechnique: () => void;
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
    playableCore: {
      mastery: Number(localStorage.getItem("playable_core_mastery")) || 0,
      trainingXp:
        Number(localStorage.getItem("playable_core_training_xp")) || 0,
      completedCycles:
        Number(localStorage.getItem("playable_core_completed_cycles")) || 0,
      cycleProgress:
        Number(localStorage.getItem("playable_core_cycle_progress")) || 0,
      refinedTechniqueOwned:
        localStorage.getItem("playable_core_refined_technique") === "true",
    },
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
  localStorage.setItem(
    "playable_core_mastery",
    String(s.playableCore.mastery)
  );
  localStorage.setItem(
    "playable_core_training_xp",
    String(s.playableCore.trainingXp)
  );
  localStorage.setItem(
    "playable_core_completed_cycles",
    String(s.playableCore.completedCycles)
  );
  localStorage.setItem(
    "playable_core_cycle_progress",
    String(s.playableCore.cycleProgress)
  );
  localStorage.setItem(
    "playable_core_refined_technique",
    String(s.playableCore.refinedTechniqueOwned)
  );
}

let nextToastId = 0;

export function GameProvider({ children }: { children: ReactNode }) {
  const lastTickAt = useRef<number | null>(null);
  const progressRef = useRef(0);
  const observedCoreCycles = useRef(0);
  const observedTechniqueOwned = useRef(false);
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
    let final = saved;

    if (skill && startTime > 0) {
      const resourceId = skill === "woodcutting" ? storedTree : storedRock;
      const resource = getResource(skill, resourceId);
      const now = Date.now();
      const production = calculateElapsedProduction(
        resource.speed,
        now - startTime
      );
      final = awardResource(saved, {
        skill,
        resourceId,
        quantity: production.completedItems,
        xpPerItem: resource.xpPerItem,
      });

      writeToStorage(final);
      const remainingElapsedMs = progressToElapsedMs(
        resource.speed,
        production.progress
      );
      localStorage.setItem(
        "active_skill_start",
        String(now - remainingElapsedMs)
      );
      setActiveSkill(skill);
      setProgress(production.progress);
      progressRef.current = production.progress;

      if (production.completedItems > 0) {
        pushToast(
          skill === "woodcutting" ? "🪵" : "🪨",
          `+${production.completedItems} ${resource.name} (offline)`
        );
      }
    }

    setState(final);
    observedCoreCycles.current = final.playableCore.completedCycles;
    observedTechniqueOwned.current =
      final.playableCore.refinedTechniqueOwned;
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeToStorage(state);
  }, [state, loaded]);

  useEffect(() => {
    if (!loaded) return;

    const newlyCompleted =
      state.playableCore.completedCycles - observedCoreCycles.current;
    observedCoreCycles.current = state.playableCore.completedCycles;

    if (newlyCompleted > 0) {
      pushToast(
        "✦",
        `+${
          newlyCompleted * PLAYABLE_CORE_CONFIG.masteryPerCycle
        } Mastery · +${
          newlyCompleted * PLAYABLE_CORE_CONFIG.trainingXpPerCycle
        } Training XP`
      );
    }
  }, [state.playableCore.completedCycles, loaded]);

  useEffect(() => {
    if (!loaded) return;

    const newlyPurchased =
      state.playableCore.refinedTechniqueOwned &&
      !observedTechniqueOwned.current;
    observedTechniqueOwned.current =
      state.playableCore.refinedTechniqueOwned;

    if (newlyPurchased) {
      pushToast(
        "◆",
        `Refined Technique: Practice now adds ${PLAYABLE_CORE_CONFIG.upgradedPracticeProgress}`
      );
    }
  }, [state.playableCore.refinedTechniqueOwned, loaded]);

  useEffect(() => {
    if (!activeSkill) return;
    const resourceId = activeSkill === "woodcutting" ? selectedTree : selectedRock;
    const resource = getResource(activeSkill, resourceId);
    const { speed, xpPerItem } = resource;
    const itemIcon = activeSkill === "woodcutting" ? "🪵" : "🪨";

    lastTickAt.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const previousTickAt = lastTickAt.current ?? now;
      lastTickAt.current = now;
      const production = calculateElapsedProduction(
        speed,
        now - previousTickAt,
        progressRef.current
      );
      progressRef.current = production.progress;
      setProgress(production.progress);

      if (production.completedItems > 0) {
        setState((s) =>
          awardResource(s, {
            skill: activeSkill,
            resourceId,
            quantity: production.completedItems,
            xpPerItem,
          })
        );
        const remainingElapsedMs = progressToElapsedMs(
          speed,
          production.progress
        );
        localStorage.setItem(
          "active_skill_start",
          String(now - remainingElapsedMs)
        );
        pushToast(
          itemIcon,
          `+${production.completedItems} ${resource.name}`
        );
      }
    }, PRODUCTION_BASE_STEP_MS);

    return () => {
      clearInterval(interval);
      lastTickAt.current = null;
    };
  }, [activeSkill, selectedTree, selectedRock]);

  function pushToast(icon: string, text: string) {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, icon, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  function startSkill(skill: SkillName) {
    setProgress(0);
    progressRef.current = 0;
    setActiveSkill(skill);
    localStorage.setItem("active_skill", skill);
    localStorage.setItem("active_skill_start", String(Date.now()));
  }

  function stopSkill() {
    setProgress(0);
    progressRef.current = 0;
    setActiveSkill(null);
    lastTickAt.current = null;
    localStorage.removeItem("active_skill");
    localStorage.removeItem("active_skill_start");
  }

  function selectResource(skill: SkillName, resourceId: string) {
    setProgress(0);
    progressRef.current = 0;
    if (activeSkill === skill) {
      const now = Date.now();
      lastTickAt.current = now;
      localStorage.setItem("active_skill_start", String(now));
    }
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
    setState((s) => purchaseTool(s, tool));
  }

  function sellItem(itemId: string, amount: number, goldPer: number) {
    setState((s) => sellInventoryItem(s, itemId, amount, goldPer));
  }

  function addGold(amount: number) {
    setState((s) => grantGold(s, amount));
  }

  function practice() {
    setState((s) => performPractice(s).state);
  }

  function buyRefinedTechnique() {
    setState((s) => purchaseRefinedTechnique(s).state);
  }

  return (
    <GameContext.Provider value={{
      state, activeSkill, progress, selectedTree, selectedRock, toasts, loaded,
      startSkill, stopSkill, selectResource, buyTool, sellItem, addGold,
      practice,
      buyRefinedTechnique,
    }}>
      {children}
    </GameContext.Provider>
  );
}
