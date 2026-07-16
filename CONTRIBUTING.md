# Contributing

## Working agreement

Development uses a GitHub Issue and pull request workflow. Each pull request
should solve one approved issue and remain small enough to understand, test, and
review independently.

Read `GAME_DESIGN.md`, `ARCHITECTURE.md`, and the relevant issue before changing
gameplay.

## Issue requirements

Every implementation issue should contain:

- Context.
- Exact scope.
- Acceptance criteria.
- Automated validation.
- Manual playtest steps for gameplay changes.
- Excluded work.
- Required documentation changes.

Do not expand an issue with unrelated mechanics. If new work is discovered,
record it for review instead of silently adding it to the pull request.

## Branch workflow

1. Confirm the issue is approved and not already in progress.
2. Begin from an up-to-date, clean base branch.
3. Create a focused branch named for the issue, for example:

   ```text
   issue-12-versioned-save
   ```

4. Make only changes required by the issue.
5. Add or update tests.
6. Perform the issue's manual playtest.
7. Run all relevant validation.
8. Open a pull request that links the issue and reports the results.

Do not mix pre-existing uncommitted work into an unrelated issue.

## Pull request expectations

A pull request description should include:

- The issue it resolves.
- A short description of the outcome.
- Important implementation decisions.
- Automated validation commands and results.
- Manual playtest steps and results.
- Screenshots for meaningful visual changes.
- Documentation changed.
- Known limitations or explicitly excluded work.

Do not state that a mechanic is fun because tests pass. Describe observed
playtest results separately from correctness.

## Current setup

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev
```

Current validation commands:

```bash
npm run lint
npm run build
```

The foundation milestone will add:

```bash
npm run type-check
npm run test
npm run test:e2e
```

Run every relevant command available at the time of the issue. If a command
cannot be run, report the command and reason in the pull request.

## Gameplay implementation guidelines

- Keep deterministic economy and progression rules outside React components.
- Pass time into domain calculations instead of reading the clock internally.
- Centralize configurable economy values.
- Enforce rules in domain commands, not only with disabled UI controls.
- Use stable internal IDs so presentation and theme can change safely.
- Keep spendable balances separate from lifetime statistics.
- Preserve fractional progress according to documented rounding rules.
- Preserve save compatibility or include a tested migration.
- Prefer a small extraction over a large rewrite.

## Save changes

Any issue that changes persisted state must document:

- The previous format.
- The new format.
- The save-version change.
- Migration behavior.
- Invalid-data recovery.
- Unit-test fixtures.
- Manual compatibility steps.

Deleting or resetting existing player progress is not an acceptable implicit
migration.

## Testing

Unit tests should focus primarily on deterministic domain behavior:

- Resource and XP calculations.
- Upgrade costs and effects.
- Unlock requirements.
- Automation and elapsed production.
- Offline progress.
- Save validation and migration.

Browser tests should cover critical player workflows rather than duplicating
every unit-test edge case.

Gameplay issues also require manual testing for comprehension, pacing, reward,
and visual feedback.

## Documentation

Update documentation in the same issue when behavior, architecture, commands,
save formats, or design hypotheses change.

Avoid documenting speculative features as committed plans.
