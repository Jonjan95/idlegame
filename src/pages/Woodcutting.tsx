import Footer from "../components/Footer";
import { useGame } from "../context/GameContext";
import { xpToLevel } from "../lib/xp";
import { TREES, SHOP_TOOLS, Resource, Tools } from "../lib/resources";

function lockReason(resource: Resource, tools: Tools): string | null {
  if (resource.toolReq && !tools[resource.toolReq]) {
    const tool = SHOP_TOOLS.find((t) => t.id === resource.toolReq);
    return `Requires ${tool?.name}`;
  }
  return null;
}

export default function Woodcutting() {
  const { state, selectedTree, selectResource, loaded } = useGame();
  const level = xpToLevel(state.wcXp);
  const currentResource = TREES.find((t) => t.id === selectedTree) ?? TREES[0];

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <div className="flex-1 p-8 max-w-2xl flex items-center justify-center">
          <p className="font-mono text-white/50 animate-pulse">Loading forest...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <div className="flex-1 p-8 max-w-2xl">
        <header className="mb-6 border-l-4 border-green-500 pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Woodcutting</h1>
          <p className="mt-1 font-mono text-white/50">
            Level {level} &mdash; {state.inventory[currentResource.id] || 0}{" "}
            {currentResource.name.toLowerCase()} (Total: {state.wcLogs})
          </p>
        </header>

        <section className="mb-6">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            Choose a tree
          </h2>
          <div className="grid grid-cols-3 gap-px bg-zinc-700">
            {TREES.map((tree) => {
              const reason = lockReason(tree, state.tools);
              const unlocked = reason === null;
              const isSelected = selectedTree === tree.id;
              return (
                <button
                  key={tree.id}
                  onClick={() => unlocked && selectResource("woodcutting", tree.id)}
                  disabled={!unlocked}
                  className={`p-4 text-left transition ${
                    isSelected
                      ? "border-l-4 border-green-500 bg-green-950/60"
                      : unlocked
                      ? "cursor-pointer bg-zinc-900 hover:bg-zinc-800"
                      : "cursor-not-allowed bg-zinc-900 opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">{tree.icon}</div>
                  <div className="text-sm font-semibold">{tree.name}</div>
                  <div className="font-mono text-xs text-white/40 mt-0.5">{tree.xpPerItem} XP</div>
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
