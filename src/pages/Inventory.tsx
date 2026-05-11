import Footer from "../components/Footer";
import { useGame } from "../context/GameContext";
import { TREES, ROCKS } from "../lib/resources";

const ALL_RESOURCES = [...TREES, ...ROCKS];

export default function Inventory() {
  const { state, loaded } = useGame();
  const inventoryItems = Object.entries(state.inventory).filter(([, qty]) => qty > 0);

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <div className="flex-1 p-8 max-w-2xl mx-auto w-full flex items-center justify-center">
          <p className="font-mono text-white/50 animate-pulse">Loading inventory...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <div className="flex-1 p-8 max-w-2xl mx-auto w-full">
        <header className="mb-6 border-l-4 border-white pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-1 font-mono text-white/50">Your gathered materials and resources</p>
        </header>

        {inventoryItems.length === 0 ? (
          <div className="border border-zinc-700 bg-zinc-900 p-8 text-center font-mono text-white/50">
            Your inventory is empty. Get to work!
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-zinc-700 sm:grid-cols-4">
            {inventoryItems.map(([id, qty]) => {
              const resource = ALL_RESOURCES.find((r) => r.id === id);
              const name = resource ? resource.name : id;
              const icon = resource ? resource.icon : "📦";
              return (
                <div key={id} className="flex flex-col items-center justify-center bg-zinc-900 p-4 text-center">
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="font-mono text-xs text-white/40 mt-1">{qty} pcs</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
