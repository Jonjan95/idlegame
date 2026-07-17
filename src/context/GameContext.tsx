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
  CURRENT_SAVE_VERSION,
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
  OFFLINE_PROGRESS_CONFIG,
  calculateOfflineProduction,
} from "../game/offlineProgress";
import {
  PLAYABLE_CORE_CONFIG,
  applySteadyRoutineElapsed,
  performPractice,
  purchaseRefinedTechnique,
  purchaseSteadyRoutine,
} from "../game/playableCore";
import {
  clearGameStorage,
  loadGameSave,
  saveGameSave,
} from "../persistence/gameStorage";

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
  buySteadyRoutine: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

let nextToastId = 0;

export function GameProvider({ children }: { children: ReactNode }) {
  const resetInProgress = useRef(false);
  const lastTickAt = useRef<number | null>(null);
  const progressRef = useRef(0);
  const observedCoreCycles = useRef(0);
  const observedTechniqueOwned = useRef(false);
  const observedRoutineOwned = useRef(false);
  const lastCoreTickAt = useRef<number | null>(null);
  const activeActivityStartedAt = useRef<number | null>(null);
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
    const loadedSave = loadGameSave(localStorage).save;
    const saved = loadedSave.state;
    let storedTree = loadedSave.selections.woodcutting;
    let storedRock = loadedSave.selections.mining;
    const activity = loadedSave.activeActivity;
    if (activity?.skill === "woodcutting") {
      storedTree = activity.resourceId;
    } else if (activity?.skill === "mining") {
      storedRock = activity.resourceId;
    }
    setSelectedTree(storedTree);
    setSelectedRock(storedRock);

    const skill = activity?.skill ?? null;
    const startTime = activity?.startedAt ?? 0;
    let final = saved;

    if (skill && startTime > 0) {
      const resourceId = activity?.resourceId ??
        (skill === "woodcutting" ? storedTree : storedRock);
      const resource = getResource(skill, resourceId);
      const now = Date.now();
      const production = calculateOfflineProduction(
        resource.speed,
        startTime,
        now
      );
      final = awardResource(saved, {
        skill,
        resourceId,
        quantity: production.completedItems,
        xpPerItem: resource.xpPerItem,
      });

      activeActivityStartedAt.current = production.accountingStartedAt;
      setActiveSkill(skill);
      setProgress(production.progress);
      progressRef.current = production.progress;

      if (production.completedItems > 0) {
        const capNotice = production.capApplied
          ? `; ${
              OFFLINE_PROGRESS_CONFIG.gatheringMaxElapsedMs / 3_600_000
            }h cap applied`
          : "";
        pushToast(
          skill === "woodcutting" ? "🪵" : "🪨",
          `+${production.completedItems} ${resource.name} (offline${capNotice})`
        );
      }
    }

    setState(final);
    observedCoreCycles.current = final.playableCore.completedCycles;
    observedTechniqueOwned.current =
      final.playableCore.refinedTechniqueOwned;
    observedRoutineOwned.current = final.playableCore.steadyRoutineOwned;
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || resetInProgress.current) return;

    const resourceId = activeSkill
      ? activeSkill === "woodcutting"
        ? selectedTree
        : selectedRock
      : null;
    const startedAt = activeActivityStartedAt.current;

    saveGameSave(localStorage, {
      version: CURRENT_SAVE_VERSION,
      state,
      selections: {
        woodcutting: selectedTree,
        mining: selectedRock,
      },
      activeActivity:
        activeSkill && resourceId && startedAt
          ? { skill: activeSkill, resourceId, startedAt }
          : null,
    });
  }, [state, loaded, activeSkill, selectedTree, selectedRock]);

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
    if (!loaded) return;

    const newlyPurchased =
      state.playableCore.steadyRoutineOwned &&
      !observedRoutineOwned.current;
    observedRoutineOwned.current = state.playableCore.steadyRoutineOwned;

    if (newlyPurchased) {
      pushToast(
        "◇",
        `Steady Routine: +${PLAYABLE_CORE_CONFIG.automationProgressPerSecond} progress per second`
      );
    }
  }, [state.playableCore.steadyRoutineOwned, loaded]);

  useEffect(() => {
    if (!loaded || !state.playableCore.steadyRoutineOwned) return;

    lastCoreTickAt.current = Date.now();
    const interval = setInterval(() => {
      if (resetInProgress.current) return;

      const now = Date.now();
      const previousTickAt = lastCoreTickAt.current ?? now;
      lastCoreTickAt.current = now;
      setState((s) =>
        applySteadyRoutineElapsed(s, now - previousTickAt).state
      );
    }, PRODUCTION_BASE_STEP_MS);

    return () => {
      clearInterval(interval);
      lastCoreTickAt.current = null;
    };
  }, [loaded, state.playableCore.steadyRoutineOwned]);

  useEffect(() => {
    if (!activeSkill) return;
    const resourceId = activeSkill === "woodcutting" ? selectedTree : selectedRock;
    const resource = getResource(activeSkill, resourceId);
    const { speed, xpPerItem } = resource;
    const itemIcon = activeSkill === "woodcutting" ? "🪵" : "🪨";

    lastTickAt.current = Date.now();

    const interval = setInterval(() => {
      if (resetInProgress.current) return;

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
        activeActivityStartedAt.current = now - remainingElapsedMs;
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
    activeActivityStartedAt.current = Date.now();
    setActiveSkill(skill);
  }

  function stopSkill() {
    setProgress(0);
    progressRef.current = 0;
    setActiveSkill(null);
    lastTickAt.current = null;
    activeActivityStartedAt.current = null;
  }

  function selectResource(skill: SkillName, resourceId: string) {
    setProgress(0);
    progressRef.current = 0;
    if (activeSkill === skill) {
      const now = Date.now();
      lastTickAt.current = now;
      activeActivityStartedAt.current = now;
    }
    if (skill === "woodcutting") {
      setSelectedTree(resourceId);
    } else {
      setSelectedRock(resourceId);
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

  function buySteadyRoutine() {
    setState((s) => purchaseSteadyRoutine(s).state);
  }

  function resetGame() {
    resetInProgress.current = true;
    lastTickAt.current = null;
    lastCoreTickAt.current = null;
    activeActivityStartedAt.current = null;
    progressRef.current = 0;

    const defaultSelections = createDefaultResourceSelections();
    setState(createDefaultGameState());
    setActiveSkill(null);
    setProgress(0);
    setSelectedTree(defaultSelections.woodcutting);
    setSelectedRock(defaultSelections.mining);
    setToasts([]);

    clearGameStorage(localStorage);
    window.location.reload();
  }

  return (
    <GameContext.Provider value={{
      state, activeSkill, progress, selectedTree, selectedRock, toasts, loaded,
      startSkill, stopSkill, selectResource, buyTool, sellItem, addGold,
      practice,
      buyRefinedTechnique,
      buySteadyRoutine,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}
