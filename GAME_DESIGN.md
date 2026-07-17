# Game Design

## Document purpose

This document records what is known, what is currently being tested, and what
remains deliberately undecided. It is not a promise of a complete feature set.

Gameplay changes should update this document when they change a committed
principle, the active design hypothesis, or the rules of the playable milestone.

## Product direction

IdleGame is intended to become a progression-focused incremental RPG. The player
should repeatedly make progress, feel meaningful improvements, unlock limited
automation, and see their capabilities grow over time.

The final theme, story, setting, character structure, and long-term progression
model are not yet decided.

## Committed design principles

These principles are stable enough to guide foundation work:

1. **A clear central interaction.** The player should quickly understand the
   main action that creates progress.
2. **Visible cause and effect.** Actions, rewards, upgrades, and production
   changes should be observable.
3. **Meaningful progression.** Improvements should change what the player can
   do or how effectively they can do it.
4. **Earned automation.** The initial interaction should not disappear
   immediately, and automatic progress should be unlocked deliberately.
5. **Gradual complexity.** New systems should be introduced only after the
   player understands the current loop.
6. **Interconnected systems later.** Systems may eventually reinforce one
   another, but only after the core loop proves worthwhile.
7. **Human playtesting matters.** Automated tests verify rules; they do not
   establish that the game is understandable, satisfying, or fun.

## Current prototype

The repository currently models two gathering skills:

- Woodcutting produces trees and logs.
- Mining produces rocks and ores.
- Both activities grant XP and levels.
- Resources can be sold for gold.
- Tools can be purchased to unlock additional resources.
- Later prototype resources can require both a skill level and an owned tool.
- One activity can remain active and generate offline progress.

Production speed is interpreted through elapsed wall-clock time rather than the
frequency of browser timer callbacks. Completed items use floor rounding, while
fractional progress is retained for the active activity. Offline production
currently has no cap; that limit will be defined by a later milestone issue.

This content is prototype scaffolding. It demonstrates several technical needs,
but it is not a final theme decision.

## Active design hypothesis

The first playable milestone will test whether this structure produces a clear
sense of progression:

```text
Perform a meaningful action
→ gain a primary resource or progress
→ purchase one upgrade
→ experience improved production
→ unlock basic automation
→ observe continued visible progress
```

Only one coherent path is required. Existing secondary prototype content should
be preserved unless removing or changing it is explicitly within an issue.

The milestone should use provisional or theme-neutral terminology internally so
the experiment can be reskinned or replaced without rewriting the game engine.

## Playable-core contract

The first experiment is a separate dashboard training panel. It does not
replace or extend the woodcutting and mining themes. Those activities remain
available as prototype scaffolding while this smaller path tests the milestone
loop directly.

The player-facing terms are intentionally provisional:

- **Practice** is the deliberate central interaction.
- **Mastery** is the single spendable resource earned from completed cycles.
- **Training XP** is lifetime progression and is never spent.
- **Refined Technique** is the one manual-production upgrade.
- **Steady Routine** is the one automation unlock.

Stable internal IDs should remain separate from those labels:

| Purpose | Stable ID |
| --- | --- |
| Manual action | `manual_practice` |
| Spendable resource | `mastery` |
| Lifetime progression | `training_xp` |
| Production upgrade | `refined_technique` |
| Automation unlock | `steady_routine` |

The exact fresh-save loop is:

```text
Press Practice to fill a visible action cycle
→ complete the cycle and gain Mastery plus Training XP
→ spend Mastery on Refined Technique
→ observe that each Practice action fills more of the cycle
→ spend further Mastery on Steady Routine
→ observe the same cycle continue automatically
```

### Provisional economy values

These values are the single design source for the experiment until they are
moved into centralized game configuration by the implementation issues:

| Rule | Value |
| --- | ---: |
| Progress required per cycle | 100 |
| Base progress per Practice action | 25 |
| Completed-cycle Mastery reward | 1 |
| Completed-cycle Training XP reward | 25 |
| Refined Technique cost | 3 Mastery |
| Upgraded progress per Practice action | 40 |
| Steady Routine cost | 8 Mastery |
| Steady Routine production | 20 progress per second while open |

The upgrade therefore requires twelve base Practice actions from a fresh save.
After buying it, the player needs eight more completed cycles, normally twenty-
four upgraded actions, to afford automation. Once unlocked, automation completes
one cycle every five seconds while the application is open. Fractional progress
is shared by manual and automatic production rather than tracked separately.

Training XP should use the existing XP curve so the player also observes a
level increase during this path. Mastery is spendable; Training XP and completed
cycle totals are lifetime statistics and must not decrease when buying an
upgrade.

These numbers are pacing hypotheses, not evidence that the loop is fun. The
browser implementation and manual playtest must evaluate whether the first
upgrade is understandable, whether its effect is noticeable, whether automation
arrives too early or late, and whether watching automated progress feels
rewarding.

### Follow-up boundaries

The contract is implemented in three small gameplay issues:

1. Add Practice, its shared progress cycle, Mastery, and Training XP.
2. Add Refined Technique using the centralized configuration and deterministic
   purchase rules.
3. Add Steady Routine using elapsed-time production while the application is
   open.

Offline automation, balance expansion, additional upgrades, new currencies,
and final thematic language remain outside those issues.

## Milestone design constraints

The **IdleGame Foundation & Playable Core** milestone should contain no more
than:

- One primary interaction.
- One primary resource or progress measure.
- One clearly noticeable production upgrade.
- One basic automation unlock.
- One visible progression path needed to support that loop.

Economy and progression values must be centralized. The exact values remain
provisional until manual playtesting.

## Existing behavior worth preserving

The following prototype behaviors are useful unless an issue intentionally
revises them:

- A single active activity.
- Skill XP and visible level progress.
- Visible action progress.
- Inventory and resource counts.
- Purchases and unlock requirements.
- Notifications for earned resources.
- Local persistence.
- A summary when offline progress is awarded.

Preserving a behavior does not require keeping its current implementation.

## Unresolved design questions

These questions are intentionally open:

- What is the central player fantasy?
- Is the main interaction training, exploration, crafting, combat preparation,
  discovery, building, or something else?
- Does the game need traditional inventory items?
- Is currency necessary for the first long-term design?
- How should RPG identity be expressed: attributes, equipment, skills,
  locations, choices, or another structure?
- What should remain engaging after automation is unlocked?
- Which systems should eventually become interconnected?
- What pacing makes an upgrade feel earned without becoming tedious?

These are design questions, not backlog commitments.

## Evaluating new ideas

New mechanics should begin as small hypotheses:

1. State the intended player feeling.
2. Define the smallest loop that could create it.
3. Identify what existing rule it changes or depends on.
4. Implement only enough to test the hypothesis.
5. Add deterministic tests for the rules.
6. Perform the issue's manual playtest.
7. Record the result before expanding the idea.

Ideas should not be added merely because they are common in incremental games.

## Explicitly outside the first milestone

- Prestige or resets as progression.
- Multiple currencies.
- Large skill or upgrade trees.
- Combat systems.
- Story campaigns.
- Multiplayer.
- Monetization.
- Backend accounts.
- Mobile release work.
- Migration to another engine.
- A major visual redesign.
