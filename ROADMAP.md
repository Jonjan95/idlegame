# Roadmap

## Roadmap policy

This roadmap intentionally contains one controlled milestone. It is not a list
of every feature the game might eventually contain.

Unvalidated ideas belong in the design questions in `GAME_DESIGN.md`, not in a
large speculative backlog. New milestone work should be proposed only after the
playable core has been manually evaluated.

## Completed milestone: IdleGame Foundation & Playable Core

### Goal

Produce a small, coherent, reliable incremental RPG experiment while keeping
the final theme and long-term structure open.

The target loop is:

```text
Perform a meaningful action
→ gain a primary resource or progress
→ buy one production upgrade
→ observe a noticeable improvement
→ unlock basic automation
→ observe continued visible progress
```

### Completion record

- Repository and contribution workflows are documented.
- Deterministic economy, progression, production, automation, and offline rules
  live outside React components and use centralized configuration.
- A normal fresh save can complete the playable loop without developer
  shortcuts, as proven by the combined Playwright journey.
- Versioned save/load validates fields, migrates legacy data, and preserves
  compatibility.
- Gathering offline progress is deterministic, capped at eight hours, and does
  not duplicate its accounted reward on reload.
- Vitest covers resource, XP, upgrade, automation, save, and offline rules.
- GitHub Actions validates lint, type-check, unit tests, build, and Chromium
  browser scenarios.
- The project owner manually evaluated the foundation on 2026-07-17 and found
  it satisfying enough to continue without requesting a balance or mechanic
  change.

### Completed issue sequence

#### Foundation and documentation

1. **Document the current foundation and contribution workflow.**
   Create the core documentation set and establish repository rules.
2. **Establish validation scripts and GitHub Actions.**
   Add a separate type-check command, Vitest, Playwright configuration, and CI.

#### Gameplay-domain cleanup

3. **Define a canonical versioned game-state model.**
   Document field meanings, defaults, invariants, and compatibility needs.
4. **Extract deterministic economy and progression commands.**
   Move rewards, purchases, selling, and unlock checks out of React.
5. **Use elapsed time for deterministic production.**
   Make progress independent of timer frequency and share rounding rules.

#### Playable core

6. **Specify the milestone economy and playable-loop contract.**
   Define the provisional Practice, Mastery, Refined Technique, and Steady
   Routine path without choosing the final theme.
7. **Implement the primary interaction and visible resource gain.**
   Add the shared 100-point cycle, manual Practice action, Mastery reward, and
   Training XP progression as a separate dashboard experiment.
8. **Add one production-improving upgrade.**
   Let Refined Technique improve manual progress using centralized values.
9. **Add one basic automation unlock.**
   Let Steady Routine add elapsed online progress to the same cycle.

#### Persistence and offline progress

10. **Implement reliable versioned save/load and legacy migration.**
11. **Make offline progress bounded and deterministic.**

#### Visual feedback

12. **Clarify progress, upgrade, and automation feedback.**
    Improve feedback, accessibility, and narrow-screen behavior without a major
    redesign.

#### Testing and final playtest

13. **Add one critical Playwright gameplay flow.** Completed by an uninterrupted
    fresh-save journey without developer shortcuts.
14. **Conduct the milestone playtest and close-out review.** Completed with the
    evidence and next hypothesis recorded in `GAME_DESIGN.md`.

Each issue must contain context, exact scope, acceptance criteria, automated
validation, manual playtest steps, excluded work, and documentation changes.

## Explicitly deferred

The following were not introduced by the completed foundation milestone and are
not committed by the next design step:

- Prestige.
- Multiple currencies.
- Large skill trees.
- Combat.
- Story.
- Multiplayer.
- Monetization.
- Mobile release.
- Backend accounts.
- Major visual redesign.
- Migration to Godot, Unity, or another engine.

Any of them requires a separate evidence-based hypothesis before it enters the
roadmap.

## First Trial experiment

The approved direction is to explore character growth through training that
enables one small meaningful trial:

```text
Train
→ improve capability
→ attempt one trial
→ observe what growth enabled
→ return with one new objective
```

The design contract is accepted. Training Level is the sole readiness
capability, Level 3 is the provisional threshold, and the one-time outcome is
deterministic. The domain rules, versioned completion milestone, dashboard
presentation, success feedback, and one Level 4 follow-up objective are
implemented.

The owner manually evaluated the First Trial, found it worked well enough to
continue, and confirmed that the compacted experiment layout was better. No
specific pacing, balance, clarity, choice, or reward change was requested.

## Completed character foundation

Issue #39 added one persistent display
name, one compact Character view, and one visible growth marker derived from the
existing First Trial completion. Its purpose is to test whether existing
progression feels more personal when it belongs to the same named character.

The owner manually confirmed that the implementation worked as intended. The
profile, save migration, progression summary, and milestone presentation are
accepted as a foundation; no deeper character mechanic is active yet.

This step does not approve classes, attributes, equipment, combat, character
power choices, final artwork, or a larger character-system backlog. Further
character work waits for its manual evaluation rather than being planned
speculatively.

Combat, loot, equipment, multiple attributes, additional currencies, a world
map, story, and the final theme remain undecided and unplanned.
