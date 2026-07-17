# IdleGame

IdleGame is an early browser-based incremental RPG prototype built with React,
TypeScript, Vite, Tailwind CSS, and React Router.

The project is in a foundation and experimentation phase. Its final theme,
setting, and long-term game structure have not been decided. The current
woodcutting, mining, inventory, and shop systems are prototype scaffolding used
to explore progression, resource generation, upgrades, automation, persistence,
and visual feedback. They are not a commitment to a gathering-focused final
game.

## Current prototype

The application currently includes:

- A separate theme-neutral Practice and Mastery experiment on the dashboard.
- Visible manual action progress, Training XP, and completed-cycle feedback.
- One persistent Refined Technique upgrade that improves manual progress.
- One earned Steady Routine unlock that adds elapsed online automation.
- Clear next-goal guidance, cycle rewards, and accessible progress indicators.
- Woodcutting and mining activities.
- Timed resource generation.
- Skill XP, levels, and level-progress displays.
- An inventory of gathered resources.
- Selling resources for gold.
- Tool purchases that unlock additional resources.
- Versioned, validated local browser saves with legacy-key migration.
- Deterministic gathering offline progress with an eight-hour cap.
- Notifications and visible action progress.

The remaining foundation work is primarily the milestone close-out review and
recording the next small design hypothesis. Multi-tab coordination remains a
known technical risk outside the active milestone. See
[ARCHITECTURE.md](./ARCHITECTURE.md) and [ROADMAP.md](./ROADMAP.md).

## Current direction

The working goal is a progression-focused incremental RPG with:

- A strong, understandable central interaction.
- Visible progress and satisfying rewards.
- Meaningful upgrades.
- Basic automation that is earned rather than available immediately.
- Gradual unlocking and room for interconnected systems later.

The first milestone, **IdleGame Foundation & Playable Core**, will prove only a
small loop:

```text
Perform a meaningful action
→ gain a primary resource or progress
→ buy one production upgrade
→ observe a noticeable improvement
→ unlock basic automation
→ observe continued progress
```

The milestone will not decide the final theme or introduce large speculative
systems.

## Technology

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

The technology stack should remain in place unless a separate approved issue
explicitly changes it.

## Getting started

Requirements:

- A current Node.js LTS release.
- npm.

Install dependencies and start the development server:

```bash
npm install
npx playwright install chromium
npm run dev
```

Vite prints the local development URL in the terminal.

## Available commands

```bash
npm run dev
npm run lint
npm run type-check
npm run test
npm run test:watch
npm run test:e2e
npm run build
npm run preview
```

`npm run test` runs deterministic unit tests with Vitest. `npm run test:e2e`
runs focused browser regressions plus one uninterrupted fresh-save journey
through Practice, Refined Technique, Steady Routine, visible automation, manual
interaction, and reload persistence.

GitHub Actions runs lint, type-checking, unit tests, the production build, and
the browser smoke test for pull requests and pushes to `main`.

## Routes

| Route | Current purpose |
| --- | --- |
| `/` | Skill dashboard and activity controls |
| `/woodcutting` | Woodcutting resource selection |
| `/mining` | Mining resource selection |
| `/inventory` | Gathered resource inventory |
| `/shop` | Resource sales and tool purchases |

## Project documentation

- [GAME_DESIGN.md](./GAME_DESIGN.md): design principles, current hypotheses,
  and unresolved questions.
- [ARCHITECTURE.md](./ARCHITECTURE.md): current implementation, risks, and
  intended domain boundaries.
- [ROADMAP.md](./ROADMAP.md): the controlled foundation milestone and issue
  sequence.
- [CONTRIBUTING.md](./CONTRIBUTING.md): issue, branch, validation, and pull
  request workflow.
- [AGENTS.md](./AGENTS.md): repository rules for coding agents.

## Project status

This is a work in progress and is not yet a balanced or release-ready game.
Automated tests can establish correctness, but decisions about clarity, pacing,
and enjoyment must be based on manual playtesting.
