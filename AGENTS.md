# Agent Instructions

These instructions apply to all work in this repository.

## Required rules

- Work on one GitHub issue at a time.
- Read GAME_DESIGN.md and relevant documentation before changing gameplay.
- Do not add unrelated mechanics.
- Do not create a large speculative backlog.
- Keep deterministic gameplay rules outside React components.
- Centralize economy and progression values.
- Add unit tests for resource, XP, upgrade and offline-progress calculations.
- Do not claim that a mechanic is fun based only on automated tests.
- Every gameplay issue must include manual playtest steps.
- Preserve save compatibility unless a migration is documented.
- Do not replace the technology stack or migrate to another engine unless explicitly approved.
- Do not introduce backend services, authentication or payments.
- Run lint, type-check, tests and build before completing an issue.
- Report any validation command that could not be run.
- Keep scope small enough for incremental pull requests.

## Repository context

The final game concept is not settled. Woodcutting, mining, inventory, tools,
and selling are prototype scaffolding, not permanent product requirements.

Treat `GAME_DESIGN.md` as the source for committed principles, the active design
hypothesis, and unresolved questions. Do not turn an unresolved idea into a
feature without an approved issue.

Treat `ARCHITECTURE.md` as the source for current technical risks and intended
domain boundaries.

## Working with existing changes

The worktree may contain changes belonging to the user. Preserve unrelated
changes and do not include them in an issue without explicit approval.

Do not use destructive Git commands to remove or overwrite user work.

## Issue completion

Before completing an issue:

1. Verify every acceptance criterion.
2. Add or update relevant automated tests.
3. Perform the documented manual playtest for gameplay changes.
4. Run every available relevant validation command.
5. Update affected documentation.
6. Report excluded work and any validation that could not be run.
