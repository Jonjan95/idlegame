# Architecture

## Overview

IdleGame is a client-only React application. React Router selects pages, a
single `GameProvider` exposes game state, and browser `localStorage` persists
progress.

The current application is small enough to improve incrementally. A major
rewrite, new state framework, backend, or engine migration is not required for
the first playable milestone.

## Current structure

```text
src/
├── components/       Shared navigation, footer, and notifications
├── context/          React game state, timers, persistence, and commands
├── game/             Canonical state and deterministic gameplay rules
├── lib/              Resource configuration and XP calculations
├── pages/            Routed application screens
├── persistence/      Versioned browser storage and legacy migration
├── App.tsx           Provider, layout, and route definitions
└── main.tsx          Browser entry point
```

### Application shell

`src/App.tsx` wraps all routes in `GameProvider`. This lets active progress
continue while the player navigates between pages.

### GameContext

`src/context/GameContext.tsx` currently owns:

- Persistent game state.
- Playable-core Practice command dispatch and completion feedback.
- Selected resources and the active skill.
- The production interval and action progress.
- Resource and XP awards.
- Purchases and selling.
- Save coordination through the versioned persistence adapter.
- Offline-progress calculation.
- Toast notification state.

This works for a prototype but mixes domain rules, browser adapters, clocks, and
React presentation concerns.

### Static configuration

`src/lib/resources.ts` contains the current resource and tool definitions.
`src/lib/xp.ts` contains pure XP and level calculations. Resource awards,
economy mutations, unlock rules, and production calculations now live in pure
game-domain modules. Browser timing and persistence coordination remain in
`GameContext`.

### Canonical game state

`src/game/state.ts` defines the React-independent state model used by
`GameContext`:

- `wcXp` and `miningXp` are cumulative lifetime XP.
- `wcLogs` and `miningOres` are cumulative lifetime production totals. They are
  not spendable balances.
- `inventory` contains spendable item quantities keyed by stable item IDs.
- `gold` is a spendable balance.
- `tools` records current prototype ownership flags.
- Resource selections store stable resource IDs for each activity.
- Active-activity metadata records the skill, resource ID, and start timestamp.
- `playableCore` records spendable Mastery, lifetime Training XP and completed
  cycles, and the current fractional cycle progress.

The module also defines:

- Default-state factories that clone mutable nested values.
- Deterministic validation issues for numeric and identifier invariants.
- A versioned `GameSave` envelope that can represent all current persistent
  values without relying on React or browser APIs.

The `GameSave` envelope is the canonical persisted format. The storage adapter
normalizes every field before it reaches React and migrates earlier individual
`localStorage` keys on first load.

### Economy domain

`src/game/economy.ts` contains deterministic, immutable state transitions for:

- Awarding one or more resources with their associated XP and lifetime
  production totals.
- Purchasing currently configured tools.
- Selling spendable inventory quantities for gold.
- Applying the existing positive debug gold grant.

The functions reject invalid quantities, prices, costs, identifiers, and unsafe
integer results without changing the input state. `GameContext` coordinates the
React state update and persistence side effects but delegates these economy
mutations to the domain module.

Resource unlock rules, elapsed-time production, and bounded offline gathering
live in dedicated domain modules.

### Production domain

`src/game/production.ts` converts configured resource speed, elapsed
milliseconds, and optional starting progress into completed items and remaining
fractional progress. Active and offline production use this same deterministic
calculation, so callback frequency no longer determines rewards.

`GameSave.activeActivity.startedAt` represents the last accounted production
boundary. When completed work is awarded, the boundary advances while retaining
the elapsed time represented by fractional progress. Resource changes reset
both progress and the boundary.

`src/game/offlineProgress.ts` applies the centralized eight-hour gathering cap
before calling the shared production rule. It accepts explicit timestamps and
returns the accounted duration, retained fractional progress, next accounting
boundary, cap status, and clock-anomaly status. Future or invalid timestamps
award nothing. After a capped absence, the next boundary is based on the current
time and retained fraction, which discards excess elapsed time and prevents an
immediate reload from paying the cap again.

The cap applies only to the existing woodcutting and mining scaffolding. Steady
Routine remains online-only until its pacing has been manually evaluated.

### Playable-core domain

`src/game/playableCoreConfig.ts` owns the stable IDs and centralized values.
`src/game/playableCore.ts` applies deterministic Practice progress,
completed-cycle rewards, Refined Technique and Steady Routine purchases, and
elapsed online automation defined by the theme-neutral contract in
`GAME_DESIGN.md`. React dispatches these commands and supplies elapsed browser
time without calculating rewards, affordability, or production in the
component.

The same module returns a deterministic guidance stage and remaining Mastery
for the next existing milestone. React maps that structured result to
player-facing wording; it does not recalculate progression costs.

Manual and automatic progress share the same fractional cycle. Steady Routine
does not store a last-accounted timestamp, so reload resumes from saved progress
without treating closed time as automation. Offline training remains a separate
milestone issue.

The experiment uses stable IDs for its action, resource, upgrade, and automation
unlock. Provisional player-facing names can therefore change after playtesting
without changing stored identifiers or calculation APIs.

The experiment is stored inside the canonical save envelope. Its fields use safe
defaults during normalization, and its earlier individual keys are covered by
the legacy migration.

### First-trial domain

`src/game/firstTrialConfig.ts` owns the stable First Trial IDs and Level 3
readiness requirement. `src/game/firstTrial.ts` implements pure rules that:

- Reads Training XP and derives Training Level through the existing progression
  rule.
- Returns a structured locked, ready, or completed status.
- Applies a deterministic one-time completion command only when ready.
- Rejects duplicate completion without changing state.
- Does not read the browser clock, React, storage, or presentation labels.

The attempt changes only the persistent completion flag. It does not spend
Mastery or Training XP and does not award another resource, item, attribute, or
upgrade.

React does not consume this module yet. A separate presentation issue should
render the structured status, dispatch the attempt, and display feedback without
calculating the Level 3 threshold or mutating progression.

### Progression domain

`src/game/progression.ts` evaluates the current prototype's centralized resource
requirements without importing React:

- Level requirements are checked before tool requirements.
- Results are structured as level locks, tool locks, or unlocked.
- A shared description helper converts those results into the current UI text.

Woodcutting and Mining consume the same rule instead of declaring duplicate
component-level lock functions. The current resource names and requirements
remain provisional scaffolding and can be replaced without changing the rule's
shape.

### Pages

Pages read state through `useGame`, render the structured domain result, and
disable resource-selection buttons while a level or tool lock is present.

## Persistence today

`src/persistence/gameStorage.ts` stores one JSON document under
`idlegame.save`. The document contains version 2 `GameSave` state, resource
selections, and active-activity metadata.

On load, the adapter:

1. Parses and normalizes a canonical version 2 save field by field.
2. Migrates canonical version 1 saves to version 2, defaulting the First Trial
   completion milestone to incomplete while preserving existing progress.
3. Preserves malformed or unsupported canonical text under
   `idlegame.save.recovery` before starting from safe defaults.
4. Migrates all known individual legacy keys when no canonical save exists.
5. Writes the normalized result back as the canonical document.

Legacy keys are retained as a non-authoritative migration snapshot but are no
longer updated. Canonical data always takes precedence. Reset removes the
canonical key, recovery key, and known legacy keys without clearing unrelated
origin storage. `GameContext` marks reset as in progress before clearing those
keys, suppresses all subsequent persistence writes, and prevents active
production callbacks from applying more progress while the page reload begins.
It also restores in-memory defaults so reset remains visible even if navigation
is delayed.

Remaining risks:

- Multiple tabs can overwrite or duplicate progress.
- Recovery data has no player-facing export or restore interface.

Any future format change must increment the save version and provide a tested,
documented migration before writing the new format.

## Intended boundaries

The target is a small layered structure, not a framework-heavy rewrite:

```text
Central game configuration
            ↓
Pure game-domain rules
            ↓
Versioned state and commands
            ↓
Persistence and clock adapters
            ↓
GameContext React adapter
            ↓
Pages and components
```

### Central game configuration

Contains provisional economy and progression values:

- Resource or progress rewards.
- Upgrade costs and effects.
- Automation costs and effects.
- Activity durations or rates.
- XP values and unlock requirements.
- Offline-progress limits.

Configuration should use stable IDs. Player-facing names and theme should not be
the only identifiers.

### Pure game domain

Pure functions should accept state, configuration, commands, and explicit time
values, then return deterministic results.

Expected responsibilities include:

- Applying an interaction.
- Awarding resources and XP.
- Calculating elapsed production.
- Buying upgrades.
- Unlocking automation.
- Selling resources if retained by the active design.
- Checking requirements.
- Calculating offline progress.
- Enforcing non-negative balances and other invariants.

Domain code must not import React, access `localStorage`, create timers, or call
`Date.now()` internally. Time should be supplied as an input.

### State and commands

A canonical game-state model should distinguish:

- Spendable balances.
- Inventory quantities.
- Lifetime statistics.
- Purchased upgrades.
- Unlocks.
- Active activity and fractional progress.
- Save version and last-accounted time.

Commands should be validated by the domain layer rather than trusting UI state.

### Persistence adapter

Persistence should:

- Store one namespaced, versioned save document.
- Validate and normalize loaded values.
- Migrate current legacy keys.
- Recover safely from malformed data.
- Reset only keys owned by IdleGame.
- Keep migration fixtures and unit tests.

### React adapter

`GameContext` should coordinate the domain, persistence, and browser clock. It
should expose state and commands to the UI without containing the economy
formulas themselves.

Timers should request updates based on elapsed time. Timer frequency must not
determine the amount of progress earned.

### Presentation

Components should:

- Render state.
- Dispatch domain-backed commands.
- Display progress and feedback.
- Explain locked and disabled actions.
- Use semantic controls, labelled progress indicators, and status announcements
  when gameplay state changes.
- Keep navigation and core actions usable without horizontal page overflow at
  narrow widths.

Components should not calculate purchases, rewards, XP awards, or offline
progress.

## Testing strategy

### Unit tests

Vitest should cover deterministic rules, including:

- Resource and XP rewards.
- Level boundaries.
- Upgrade affordability and effects.
- Unlock requirements.
- Automation production.
- Elapsed-time rounding.
- Offline-progress caps and clock anomalies.
- Save validation and migration.

### Browser test

One critical Playwright test covers a fresh save through:

```text
interaction
→ resource gain
→ upgrade purchase
→ improved production
→ automation unlock
→ visible progress
→ reload persistence
```

The journey uses only player-visible controls, condition-based assertions, and
the normal fresh-save setup. It does not seed progression or use developer
shortcuts. Focused browser scenarios remain alongside it for narrower failure
diagnosis.

### Manual testing

Every gameplay issue must contain manual playtest steps. Human testing is
required for clarity, pacing, feedback, and perceived reward.

## Validation target

The standard validation suite will be:

```bash
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```

Vitest provides deterministic domain and persistence tests. Playwright covers
navigation, migration, persistence, production accounting, focused
playable-core steps, and the combined fresh-save critical loop. GitHub Actions
runs the validation suite for pull requests and pushes to `main`.

## Constraints

- Keep the existing technology stack.
- Do not introduce backend services, authentication, or payments.
- Prefer incremental extraction over large rewrites.
- Preserve save compatibility or document a migration.
- Keep changes small enough for one issue and one reviewable pull request.
