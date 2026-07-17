# Roadmap

## Roadmap policy

This roadmap intentionally contains one controlled milestone. It is not a list
of every feature the game might eventually contain.

Unvalidated ideas belong in the design questions in `GAME_DESIGN.md`, not in a
large speculative backlog. New milestone work should be proposed only after the
playable core has been manually evaluated.

## Active milestone: IdleGame Foundation & Playable Core

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

### Completion criteria

- The current repository and development workflow are documented.
- Gameplay rules are deterministic and kept outside React components.
- Economy and progression values have a single source.
- A fresh player can complete the target loop without developer shortcuts.
- Save/load is versioned, validated, and compatible with existing saves.
- Offline progress does not duplicate online progress and has a documented cap.
- Unit tests cover resource, XP, upgrade, automation, and offline calculations.
- One Playwright test covers the critical playable flow.
- GitHub Actions validates lint, type-check, unit tests, and build.
- A manual playtest checklist has been completed and its findings recorded.

### Planned issue sequence

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
14. **Conduct the milestone playtest and close-out review.**

Each issue must contain context, exact scope, acceptance criteria, automated
validation, manual playtest steps, excluded work, and documentation changes.

## Explicitly deferred

The following are not planned for the active milestone:

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

They may be reconsidered only after the small core loop produces useful
playtest evidence.

## After the milestone

The next roadmap decision should be based on:

- Which interaction felt most understandable and rewarding.
- Whether the upgrade produced a meaningful change.
- Whether automation arrived at an appropriate time.
- Which existing prototype systems supported the experience.
- Which theme or RPG framing best fits the proven loop.

The result may be to expand, revise, or discard the playable hypothesis.
