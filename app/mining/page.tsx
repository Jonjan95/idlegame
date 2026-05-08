"use client";

import Footer from "../components/footer";
import { useGame } from "../context/GameContext";
import { xpToLevel } from "../lib/xp";
import { ROCKS, SHOP_TOOLS, Resource, Tools } from "../lib/resources";

function lockReason(resource: Resource, tools: Tools): string | null {
  if (resource.toolReq && !tools[resource.toolReq]) {
    const tool = SHOP_TOOLS.find((t) => t.id === resource.toolReq);
    return `Requires ${tool?.name}`;
  }
  return null;
}

export default function MiningPage() {
  const { state, selectedRock, selectResource, loaded } = useGame();
  const level = xpToLevel(state.miningXp);
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
        </header>

        <section className="mb-6">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            Choose a rock
          </h2>
          <div className="grid grid-cols-3 gap-px bg-zinc-700">
            {ROCKS.map((rock) => {
              const reason = lockReason(rock, state.tools);
              const unlocked = reason === null;
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
