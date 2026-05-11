import Footer from "../components/Footer";
import { useGame } from "../context/GameContext";
import { SHOP_TOOLS, TREES, ROCKS } from "../lib/resources";

const ALL_RESOURCES = [...TREES, ...ROCKS];

export default function Shop() {
  const { state, buyTool, sellItem, loaded } = useGame();
  const inventoryItems = Object.entries(state.inventory).filter(([, qty]) => qty > 0);
  const woodcuttingTools = SHOP_TOOLS.filter((t) => t.skill === "woodcutting");
  const miningTools = SHOP_TOOLS.filter((t) => t.skill === "mining");

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <div className="flex-1 p-8 max-w-2xl flex items-center justify-center">
          <p className="font-mono text-white/50 animate-pulse">Loading shop...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <div className="flex-1 p-8 max-w-2xl">
        <header className="mb-8 border-l-4 border-yellow-500 pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
          <p className="mt-2 flex items-center gap-2">
            <span className="text-yellow-400">💰</span>
            <span className="font-mono font-bold text-yellow-300">{state.gold}</span>
            <span className="font-mono text-sm text-white/40">gold</span>
          </p>
        </header>

        {[
          { label: "🪓 Woodcutting", tools: woodcuttingTools },
          { label: "⛏️ Mining", tools: miningTools },
        ].map(({ label, tools }) => (
          <section key={label} className="mb-8">
            <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
              {label}
            </h2>
            <div className="grid grid-cols-1 gap-px bg-zinc-700 sm:grid-cols-2">
              {tools.map((tool) => {
                const owned = state.tools[tool.id];
                const canAfford = state.gold >= tool.cost;
                return (
                  <div
                    key={tool.id}
                    className={`p-5 transition ${owned ? "border-l-4 border-green-500 bg-green-950/40" : "bg-zinc-900"}`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <p className="font-semibold">{tool.name}</p>
                          <p className="font-mono text-xs text-white/40">Unlocks: {tool.unlocks}</p>
                        </div>
                      </div>
                      {owned && (
                        <span className="border border-green-700 bg-green-950 px-2 py-0.5 font-mono text-xs text-green-300">
                          Owned
                        </span>
                      )}
                    </div>
                    {!owned && (
                      <button
                        onClick={() => buyTool(tool.id)}
                        disabled={!canAfford}
                        className={`w-full border px-4 py-2 font-mono text-sm font-medium transition ${
                          canAfford
                            ? "border-yellow-600 bg-yellow-900/40 text-yellow-300 hover:bg-yellow-800/60 cursor-pointer"
                            : "cursor-not-allowed border-zinc-700 bg-zinc-900 text-white/30"
                        }`}
                      >
                        {canAfford ? `Buy — ${tool.cost} 💰` : `Need ${tool.cost} 💰`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="mb-8">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            📦 Sell Materials
          </h2>
          {inventoryItems.length === 0 ? (
            <div className="border border-zinc-700 bg-zinc-900 p-5 text-center font-mono text-sm text-white/50">
              You don&apos;t have any materials to sell. Get to work!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-zinc-700 sm:grid-cols-2">
              {inventoryItems.map(([id, qty]) => {
                const resource = ALL_RESOURCES.find((r) => r.id === id);
                if (!resource) return null;
                return (
                  <div key={id} className="flex items-center justify-between bg-zinc-900 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{resource.icon}</span>
                      <div>
                        <p className="font-semibold">{resource.name}</p>
                        <p className="font-mono text-xs text-white/40">{qty} in inventory</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => sellItem(id, 1, resource.goldPer)}
                        className="border border-green-700 bg-green-950/50 px-3 py-1 font-mono text-xs font-medium transition hover:bg-green-900/60"
                      >
                        Sell 1 ({resource.goldPer} 💰)
                      </button>
                      <button
                        onClick={() => sellItem(id, qty, resource.goldPer)}
                        className="border border-green-700 bg-green-950/50 px-3 py-1 font-mono text-xs font-medium transition hover:bg-green-900/60"
                      >
                        Sell All ({qty * resource.goldPer} 💰)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
