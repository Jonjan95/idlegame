import Footer from "../components/Footer";
import { useGame } from "../context/GameContext";
import { xpToLevel, levelProgressPercent } from "../lib/xp";
import { ROCKS } from "../lib/resources";
import {
  describeResourceLock,
  getResourceLock,
} from "../game/progression";

export default function Mining() {
  const { state, selectedRock, selectResource, loaded } = useGame();
  const level = xpToLevel(state.miningXp);
  const pct = levelProgressPercent(state.miningXp);
  const currentResource = ROCKS.find((r) => r.id === selectedRock) ?? ROCKS[0];

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <div className="flex-1 p-8 max-w-2xl flex items-center justify-center">
          <p className="font-mono text-white/50 animate-pulse">Loading mine...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <div className="flex-1 p-8 max-w-2xl">
        <header className="mb-6 border-l-4 border-amber-500 pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Mining</h1>
          <p className="mt-1 font-mono text-white/50">
            Level {level} &mdash; {state.inventory[currentResource.id] || 0}{" "}
            {currentResource.name.toLowerCase()} (Total: {state.miningOres})
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            Choose a rock
          </h2>
          <div className="grid grid-cols-3 gap-px bg-zinc-700">
            {ROCKS.map((rock) => {
              const lock = getResourceLock(rock, state.tools, level);
              const reason = describeResourceLock(lock);
              const unlocked = lock === null;
              const isSelected = selectedRock === rock.id;
              return (
                <button
                  key={rock.id}
                  onClick={() => unlocked && selectResource("mining", rock.id)}
                  disabled={!unlocked}
                  className={`p-4 text-left transition ${
                    isSelected
                      ? "border-l-4 border-amber-500 bg-amber-950/60"
                      : unlocked
                      ? "cursor-pointer bg-zinc-900 hover:bg-zinc-800"
                      : "cursor-not-allowed bg-zinc-900 opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">{rock.icon}</div>
                  <div className="text-sm font-semibold">{rock.name}</div>
                  <div className="font-mono text-xs text-white/40 mt-0.5">{rock.xpPerItem} XP</div>
                  {!unlocked && (
                    <div className="font-mono text-xs text-red-400 mt-1">{reason}</div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
