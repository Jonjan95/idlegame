import Footer from "../components/Footer";
import { useGame, SkillName } from "../context/GameContext";
import { xpToLevel, levelProgressPercent } from "../lib/xp";

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
    <div
      onClick={handleClick}
      className={`cursor-pointer border p-5 transition hover:brightness-110 ${
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
              <span className="h-1.5 w-1.5 animate-pulse bg-green-400" />
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

      <div className="h-1.5 w-full bg-white/10">
        <div
          className={`h-full transition-all duration-300 ${isActive ? props.colors.bar : "bg-zinc-600"}`}
          style={{ width: `${levelProgressPercent(props.xp)}%` }}
        />
      </div>

      {isActive && (
        <div className="mt-3">
          <div className="h-2 w-full bg-white/10">
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
    </div>
  );
}

export default function Home() {
  const { state, addGold } = useGame();
  const totalLevel = xpToLevel(state.wcXp) + xpToLevel(state.miningXp);

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

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-white/30">
            Skills
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

      <div className="fixed bottom-6 right-6 flex items-center gap-2 z-50">
        <button
          onClick={() => addGold(1000)}
          className="border border-yellow-700 bg-yellow-950 px-4 py-2 font-mono text-xs font-bold tracking-wider text-yellow-400 transition-colors hover:bg-yellow-900"
        >
          +1000 💰
        </button>
        <button
          onClick={() => {
            if (window.confirm("Sure you want to reset? Cannot be undone!")) {
              localStorage.clear();
              window.location.reload();
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
