import { FormEvent, useEffect, useState } from "react";
import Footer from "../components/Footer";
import { useGame } from "../context/GameContext";
import { CHARACTER_PROFILE_CONFIG } from "../game/characterProfileConfig";

export default function Character() {
  const { characterProgress, loaded, renameCharacter } = useGame();
  const [draftName, setDraftName] = useState(characterProgress.name);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  useEffect(() => {
    setDraftName(characterProgress.name);
  }, [characterProgress.name]);

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = renameCharacter(draftName);
    if (result.accepted) {
      setDraftName(result.name);
      setFeedback(`Character name saved as ${result.name}.`);
      return;
    }

    setFeedback(
      result.issue === "too_long"
        ? `Use ${CHARACTER_PROFILE_CONFIG.maximumNameLength} characters or fewer.`
        : "Enter at least one visible character."
    );
  }

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col bg-zinc-950 text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center p-4 sm:p-8">
          <p className="animate-pulse font-mono text-white/50">
            Loading character...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const proven = characterProgress.stage === "trial_proven";

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
        <header className="mb-6 border-l-4 border-white pl-4">
          <h1 className="text-3xl font-bold tracking-tight">Character</h1>
          <p className="mt-1 font-mono text-sm text-white/50">
            A temporary home for identity and visible growth
          </p>
        </header>

        <section
          className={`border p-4 sm:p-6 ${
            proven
              ? "border-amber-500 bg-amber-950/20"
              : "border-zinc-700 bg-zinc-900"
          }`}
          data-testid="character-card"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center border text-4xl font-bold ${
                proven
                  ? "border-amber-400 bg-amber-900/50 text-amber-100"
                  : "border-violet-500 bg-violet-950 text-violet-200"
              }`}
              aria-hidden="true"
            >
              {characterProgress.initial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-widest text-white/40">
                    Character profile
                  </p>
                  <h2
                    className="mt-1 break-words text-2xl font-bold"
                    data-testid="character-name"
                  >
                    {characterProgress.name}
                  </h2>
                </div>
                <span
                  className={`border px-2 py-1 font-mono text-xs font-semibold ${
                    proven
                      ? "border-amber-500 bg-amber-950 text-amber-200"
                      : "border-zinc-600 bg-zinc-950 text-white/60"
                  }`}
                  data-testid="character-stage"
                >
                  {characterProgress.stageLabel}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px bg-zinc-700">
                <div className="bg-zinc-950/90 p-3">
                  <p className="font-mono text-xs text-white/40">
                    Training Level
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {characterProgress.trainingLevel}
                  </p>
                </div>
                <div className="bg-zinc-950/90 p-3">
                  <p className="font-mono text-xs text-white/40">
                    Lifetime Training XP
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {characterProgress.trainingXp}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex flex-wrap justify-between gap-2 font-mono text-xs text-white/50">
                  <span>Next Training Level</span>
                  <span>{characterProgress.nextTrainingLevelXp} XP</span>
                </div>
                <div
                  className="h-2 w-full bg-white/10"
                  role="progressbar"
                  aria-label="Character training level progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={characterProgress.trainingLevelProgress}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      proven ? "bg-amber-400" : "bg-violet-400"
                    }`}
                    style={{
                      width: `${characterProgress.trainingLevelProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-5 border-l-2 px-3 py-3 ${
              proven
                ? "border-amber-400 bg-amber-950/40"
                : "border-violet-500 bg-violet-950/40"
            }`}
            data-testid="character-milestone"
          >
            <p className="font-mono text-xs uppercase tracking-wider text-white/40">
              Growth record
            </p>
            <p className="mt-1 font-semibold">
              {proven
                ? "First Trial completed"
                : "First Trial not yet completed"}
            </p>
            <p className="mt-1 text-sm text-white/60">
              Next objective: {characterProgress.nextObjective}
            </p>
            {proven && (
              <p className="mt-2 text-xs text-amber-200/70">
                This marker records growth only and grants no additional power.
              </p>
            )}
          </div>
        </section>

        <section className="mt-4 border border-zinc-700 bg-zinc-900 p-4 sm:p-6">
          <h2 className="text-lg font-bold">Choose a name</h2>
          <p className="mt-1 text-sm text-white/50">
            This identity persists, but it can be changed while the character
            direction remains experimental.
          </p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={saveName}
          >
            <label className="min-w-0 flex-1">
              <span className="mb-1 block font-mono text-xs text-white/50">
                Character name
              </span>
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={CHARACTER_PROFILE_CONFIG.maximumNameLength + 8}
                aria-describedby="character-name-help character-name-feedback"
                className="w-full border border-zinc-600 bg-zinc-950 px-3 py-2 text-white outline-none transition focus:border-violet-400"
              />
            </label>
            <button
              type="submit"
              className="self-end border border-violet-500 bg-violet-900/60 px-4 py-2 font-mono text-sm font-semibold text-violet-100 transition hover:bg-violet-800/70 active:translate-y-px"
            >
              Save name
            </button>
          </form>
          <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-xs text-white/40">
            <span id="character-name-help">
              Repeated spaces are collapsed when saved.
            </span>
            <span>
              {Array.from(draftName.trim()).length}/
              {CHARACTER_PROFILE_CONFIG.maximumNameLength}
            </span>
          </div>
          <p
            className="mt-2 min-h-5 text-sm text-violet-200"
            id="character-name-feedback"
            role="status"
          >
            {feedback}
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
