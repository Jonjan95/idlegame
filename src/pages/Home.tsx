import Footer from "../components/Footer";
import { useGame, SkillName } from "../context/GameContext";
import { xpToLevel, levelProgressPercent } from "../lib/xp";
import {
  PLAYABLE_CORE_CONFIG,
  getPlayableCoreGuidance,
} from "../game/playableCore";

function formatCycleProgress(progress: number): string {
  return Number.isInteger(progress) ? String(progress) : progress.toFixed(1);
}

interface SkillCardProps {
  name: string;
  skillKey: SkillName;
  xp: number;
  icon: string;
  colors: {
    activeBorder: string;
    activeBg: string;
    bar: string;
    badge: string;
    actionBar: string;
    actionText: string;
  };
}

function SkillCard(props: SkillCardProps) {
  const { activeSkill, progress, startSkill, stopSkill } = useGame();
  const level = xpToLevel(props.xp);
  const isActive = activeSkill === props.skillKey;

  function handleClick() {
    if (isActive) stopSkill();
    else startSkill(props.skillKey);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${isActive ? "Stop" : "Start"} ${props.name}`}
      aria-pressed={isActive}
      className={`w-full cursor-pointer border p-5 text-left transition hover:brightness-110 ${
        isActive
          ? `border-l-4 ${props.colors.activeBorder} ${props.colors.activeBg}`
          : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{props.icon}</span>
          <span className="text-base font-semibold text-white">{props.name}</span>
          {isActive && (
            <span className="flex items-center gap-1 border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/60">
              <span className="h-1.5 w-1.5 bg-green-400 motion-safe:animate-pulse" />
              active
            </span>
          )}
        </div>
        <span className={`px-3 py-1 font-mono text-sm font-bold ${
          isActive ? props.colors.badge : "bg-zinc-800 text-zinc-300"
        }`}>
          Lvl {level}
        </span>
      </div>

      <div
        className="h-1.5 w-full bg-white/10"
        role="progressbar"
        aria-label={`${props.name} level progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={levelProgressPercent(props.xp)}
      >
        <div
          className={`h-full transition-all duration-300 ${isActive ? props.colors.bar : "bg-zinc-600"}`}
          style={{ width: `${levelProgressPercent(props.xp)}%` }}
        />
      </div>

      {isActive && (
        <div className="mt-3">
          <div
            className="h-2 w-full bg-white/10"
            role="progressbar"
            aria-label={`${props.name} action progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className={`h-full ${props.colors.actionBar}`}
              style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
            />
          </div>
          <p className={`mt-1 font-mono text-xs ${props.colors.actionText}`}>
            {props.skillKey === "woodcutting" ? "Chopping..." : "Mining..."}
          </p>
        </div>
      )}
    </button>
  );
}

export default function Home() {
  const {
    state,
    addGold,
    practice,
    buyRefinedTechnique,
    buySteadyRoutine,
    resetGame,
  } = useGame();
  const totalLevel = xpToLevel(state.wcXp) + xpToLevel(state.miningXp);
  const trainingLevel = xpToLevel(state.playableCore.trainingXp);
  const trainingLevelProgress = levelProgressPercent(
    state.playableCore.trainingXp
  );
  const techniqueOwned = state.playableCore.refinedTechniqueOwned;
  const canAffordTechnique =
    state.playableCore.mastery >= PLAYABLE_CORE_CONFIG.refinedTechniqueCost;
  const practiceProgress = techniqueOwned
    ? PLAYABLE_CORE_CONFIG.upgradedPracticeProgress
    : PLAYABLE_CORE_CONFIG.basePracticeProgress;
  const routineOwned = state.playableCore.steadyRoutineOwned;
  const canAffordRoutine =
    techniqueOwned &&
    state.playableCore.mastery >= PLAYABLE_CORE_CONFIG.steadyRoutineCost;
  const guidance = getPlayableCoreGuidance(state);

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-950 px-4 py-12 text-white">
      <div className="w-full max-w-2xl flex-1">
        <div className="mb-8 border-l-4 border-white pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 font-mono text-white/50">
            Total level:{" "}
            <span className="font-semibold text-white/80">{totalLevel}</span>
          </p>
        </div>

        <section
          className="mb-8 border border-violet-700/70 bg-violet-950/30 p-5"
          data-testid="playable-core"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-violet-300/70">
                Playable Core Experiment
              </p>
              <h2 className="mt-1 text-xl font-bold">Training</h2>
              <p className="mt-1 max-w-lg text-sm text-white/50">
                Practice deliberately, complete cycles, and build lasting
                mastery. Names and theme are provisional.
              </p>
            </div>
            <div className="border border-violet-700 bg-violet-950 px-3 py-2 text-right">
              <p className="font-mono text-xs text-violet-300/60">Mastery</p>
              <p className="font-mono text-xl font-bold text-violet-200">
                <span data-testid="core-mastery">
                  {state.playableCore.mastery}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-px bg-violet-900/50 text-sm sm:grid-cols-3">
            <div className="bg-zinc-950/80 p-3">
              <p className="font-mono text-xs text-white/40">Training level</p>
              <p className="mt-1 font-semibold">Level {trainingLevel}</p>
            </div>
            <div className="bg-zinc-950/80 p-3">
              <p className="font-mono text-xs text-white/40">Training XP</p>
              <p className="mt-1 font-semibold">
                <span data-testid="core-training-xp">
                  {state.playableCore.trainingXp}
                </span>
              </p>
            </div>
            <div className="col-span-2 bg-zinc-950/80 p-3 sm:col-span-1">
              <p className="font-mono text-xs text-white/40">Cycles completed</p>
              <p className="mt-1 font-semibold">
                <span data-testid="core-completed-cycles">
                  {state.playableCore.completedCycles}
                </span>
              </p>
            </div>
          </div>

          <div
            className="mb-4 border-l-2 border-violet-400 bg-violet-950/60 px-3 py-2"
            data-testid="core-guidance"
            aria-live="polite"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-violet-300/70">
              {guidance.stage === "automation_active"
                ? "Current state"
                : "Next goal"}
            </p>
            <p className="mt-1 text-sm font-semibold text-violet-100">
              {guidance.stage === "refined_technique" &&
                `Refined Technique · ${
                  guidance.masteryRemaining === 0
                    ? "Ready to buy"
                    : `${guidance.masteryRemaining} Mastery remaining`
                }`}
              {guidance.stage === "steady_routine" &&
                `Steady Routine · ${
                  guidance.masteryRemaining === 0
                    ? "Ready to unlock"
                    : `${guidance.masteryRemaining} Mastery remaining`
                }`}
              {guidance.stage === "automation_active" &&
                "Automation active · Manual Practice remains available"}
            </p>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex justify-between font-mono text-xs text-white/50">
              <span>Current cycle</span>
              <span>
                {formatCycleProgress(state.playableCore.cycleProgress)} /{" "}
                {PLAYABLE_CORE_CONFIG.cycleProgressRequired}
              </span>
            </div>
            <div
              className="h-3 w-full bg-white/10"
              role="progressbar"
              aria-label="Practice cycle progress"
              aria-valuemin={0}
              aria-valuemax={PLAYABLE_CORE_CONFIG.cycleProgressRequired}
              aria-valuenow={state.playableCore.cycleProgress}
            >
              <div
                className="h-full bg-violet-400 transition-all duration-150"
                style={{
                  width: `${state.playableCore.cycleProgress}%`,
                }}
              />
            </div>
            <p className="mt-2 font-mono text-xs text-violet-200/70">
              Complete cycle: +{PLAYABLE_CORE_CONFIG.masteryPerCycle} Mastery
              {" · +"}
              {PLAYABLE_CORE_CONFIG.trainingXpPerCycle} Training XP
            </p>
            <p
              className="mt-1 font-mono text-xs text-white/50"
              data-testid="practice-strength"
            >
              Manual Practice: +{practiceProgress} progress per press
            </p>
          </div>

          <div className="mb-1 flex justify-between font-mono text-xs text-white/50">
            <span>Training level progress</span>
            <span>{Math.floor(trainingLevelProgress)}%</span>
          </div>
          <div
            className="mb-4 h-1.5 w-full bg-white/10"
            role="progressbar"
            aria-label="Training level progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={trainingLevelProgress}
          >
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${trainingLevelProgress}%` }}
            />
          </div>

          <div className="mb-4 border border-zinc-700 bg-zinc-950/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Refined Technique</p>
                <p className="mt-1 font-mono text-xs text-white/50">
                  Practice progress {PLAYABLE_CORE_CONFIG.basePracticeProgress}
                  {" → "}
                  {PLAYABLE_CORE_CONFIG.upgradedPracticeProgress}
                </p>
              </div>
              {techniqueOwned ? (
                <span
                  className="border border-emerald-700 bg-emerald-950 px-2 py-1 font-mono text-xs text-emerald-300"
                  data-testid="refined-technique-owned"
                >
                  Owned
                </span>
              ) : (
                <button
                  type="button"
                  onClick={buyRefinedTechnique}
                  disabled={!canAffordTechnique}
                  className={`border px-3 py-2 font-mono text-xs font-semibold transition ${
                    canAffordTechnique
                      ? "border-violet-500 bg-violet-900/60 text-violet-100 hover:bg-violet-800/70"
                      : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-white/30"
                  }`}
                >
                  {canAffordTechnique
                    ? `Buy for ${PLAYABLE_CORE_CONFIG.refinedTechniqueCost} Mastery`
                    : `Needs ${PLAYABLE_CORE_CONFIG.refinedTechniqueCost} Mastery`}
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 border border-zinc-700 bg-zinc-950/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Steady Routine</p>
                <p className="mt-1 font-mono text-xs text-white/50">
                  +{PLAYABLE_CORE_CONFIG.automationProgressPerSecond} progress
                  per second while open
                </p>
              </div>
              {routineOwned ? (
                <span
                  className="flex items-center gap-1.5 border border-sky-700 bg-sky-950 px-2 py-1 font-mono text-xs text-sky-300"
                  data-testid="steady-routine-owned"
                >
                  <span className="h-1.5 w-1.5 bg-sky-400 motion-safe:animate-pulse" />
                  Running
                </span>
              ) : (
                <button
                  type="button"
                  onClick={buySteadyRoutine}
                  disabled={!canAffordRoutine}
                  className={`border px-3 py-2 font-mono text-xs font-semibold transition ${
                    canAffordRoutine
                      ? "border-sky-500 bg-sky-900/60 text-sky-100 hover:bg-sky-800/70"
                      : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-white/30"
                  }`}
                >
                  {!techniqueOwned
                    ? "Requires Refined Technique"
                    : canAffordRoutine
                    ? `Unlock for ${PLAYABLE_CORE_CONFIG.steadyRoutineCost} Mastery`
                    : `Needs ${PLAYABLE_CORE_CONFIG.steadyRoutineCost} Mastery`}
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={practice}
            className="w-full border border-violet-500 bg-violet-900/60 px-4 py-3 font-mono font-semibold text-violet-100 transition hover:bg-violet-800/70 active:translate-y-px"
          >
            Practice +{practiceProgress} progress
          </button>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            Prototype Activities
          </h2>
          <div className="grid grid-cols-1 gap-px bg-zinc-700 sm:grid-cols-2">
            <SkillCard
              name="Woodcutting"
              skillKey="woodcutting"
              xp={state.wcXp}
              icon="🪓"
              colors={{
                activeBorder: "border-green-500",
                activeBg: "bg-green-950/60",
                bar: "bg-green-500",
                badge: "bg-green-950 text-green-300",
                actionBar: "bg-green-400",
                actionText: "text-green-400/80",
              }}
            />
            <SkillCard
              name="Mining"
              skillKey="mining"
              xp={state.miningXp}
              icon="⛏️"
              colors={{
                activeBorder: "border-amber-500",
                activeBg: "bg-amber-950/60",
                bar: "bg-amber-500",
                badge: "bg-amber-950 text-amber-300",
                actionBar: "bg-amber-400",
                actionText: "text-amber-400/80",
              }}
            />
          </div>
        </section>
      </div>
      <Footer />

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => addGold(1000)}
          className="border border-yellow-700 bg-yellow-950 px-4 py-2 font-mono text-xs font-bold tracking-wider text-yellow-400 transition-colors hover:bg-yellow-900"
        >
          +1000 💰
        </button>
        <button
          onClick={() => {
            if (window.confirm("Sure you want to reset? Cannot be undone!")) {
              resetGame();
            }
          }}
          className="border border-red-800 bg-red-950 px-4 py-2 font-mono text-xs font-bold tracking-wider text-red-400 transition-colors hover:bg-red-900"
        >
          Wipe Save
        </button>
      </div>
    </main>
  );
}
