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

Character progression and training are now the preferred direction for the next
experiment. Progress should eventually demonstrate what the character has
become capable of doing, rather than existing only to make numbers increase.

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
for an active gathering skill is limited to eight hours per return. Elapsed time
beyond that cap is discarded after the capped reward is accounted for, so an
immediate reload cannot award the capped absence again.

This content is prototype scaffolding. It demonstrates several technical needs,
but it is not a final theme decision.

## Completed foundation hypothesis

The first playable milestone tested whether this structure could produce a
clear sense of progression:

```text
Perform a meaningful action
→ gain a primary resource or progress
→ purchase one upgrade
→ experience improved production
→ unlock basic automation
→ observe continued visible progress
```

The implemented path is the stable baseline for the next experiment. Existing
secondary prototype content should be preserved unless removing or changing it
is explicitly within an issue.

The milestone used provisional, theme-neutral terminology internally so the
experiment can be reskinned or replaced without rewriting the game engine.

## Playtest evidence

On 2026-07-17, the project owner evaluated the implemented foundation and found
the current groundwork satisfying enough to continue. The playtest did not
identify a specific mechanic or balance value that should change yet.

That result supports preserving the current loop while improving how clearly it
communicates the next goal, cycle rewards, upgrade effect, and automation state.
It is not evidence that the provisional theme or long-term game structure is
settled.

The owner subsequently approved character progression and training as important
to the next direction, with a small meaningful objective that demonstrates what
the character's growth enabled.

On 2026-07-18, the owner found that the First Trial behavior worked well, but
the experiment page required too much scrolling because the primary Practice
action sat below the status, objective, and upgrade panels. During this
experiment phase, the primary action should stay beside the progress it affects
and related controls may use compact responsive grouping. This is temporary
testing scaffolding, not a commitment to the final game interface.

After the Practice action was moved beside its progress, the owner confirmed
that the layout was better and chose to continue toward a more personal
character experience. No specific pacing, balance, clarity, choice, or reward
problem was identified that should expand the First Trial itself. This is
enough evidence to close the bounded experiment, while remaining less than a
claim that its mechanics or presentation are final.

On 2026-07-18, the owner manually tested the persistent character profile and
confirmed that it all worked as intended. This accepts naming, persistence, the
compact Character view, and the visible First Trial growth marker as a stable
foundation. It does not by itself establish which deeper character mechanics
would be enjoyable or whether the provisional presentation should be final.

## Next design hypothesis: character growth and one trial

### Intended player feeling

Training should build anticipation because the player understands that growing
capability will enable something concrete. Completing the objective should make
earlier progress feel purposeful, then provide a clear reason to return to
training.

### Smallest candidate loop

```text
Train deliberately
→ improve one expression of character capability
→ become ready for one meaningful trial
→ attempt the trial
→ visibly observe what the growth enabled
→ return to training with one new objective
```

The trial is a design role, not a commitment to a theme or system. It could
later be expressed as an expedition, climb, ritual, investigation, commission,
or another bounded challenge. It does not currently imply combat, enemies,
random loot, equipment, a world map, or a story campaign.

### Contract review boundaries

The accepted design issue specified only:

- Which single capability the trial reads.
- How readiness is communicated before the attempt.
- Whether the first outcome is deterministic or contains a limited choice.
- What visible result proves that training mattered.
- What one new objective appears after completion.
- How existing Training XP, Mastery, and automation relate to the experiment
  without adding another currency by default.

That design issue did not implement the trial. It produced this small contract
for review before source code changes.

## Accepted first-trial contract

This contract was accepted and implemented as a small experiment. Its
deterministic rules and compact dashboard presentation were manually evaluated
and found sufficient to continue toward a more personal character experience.
Its purpose was to test whether the existing training loop feels more
meaningful when lifetime character growth enables one deliberate objective.

That result supports continuing; it does not establish a final interface,
theme, balance, or complete progression model. The evaluation questions below
remain useful whenever the experiment is changed.

### Stable concepts and provisional wording

Stable IDs must not depend on the eventual theme:

| Purpose | Stable ID | Provisional wording |
| --- | --- | --- |
| Readiness capability | `training_level` | Training Level |
| One-time objective | `first_trial` | First Trial |
| Completion milestone | `first_trial_completed` | Trial Completed |
| Follow-up objective | `reach_training_level_4` | Reach Training Level 4 |

The player-facing words may change after the theme is explored. The stable
concepts describe only their role in the experiment.

### Readiness

Training Level is the only capability read by the First Trial. The provisional
requirement is Training Level 3, which begins at 400 lifetime Training XP under
the existing curve:

```text
(level - 1)² × 100
= (3 - 1)² × 100
= 400 Training XP
```

The normal fresh-save path reaches Steady Routine after eleven cycles and 275
Training XP. Readiness therefore requires another 125 Training XP, or five
completed cycles at the current 25 XP reward. Those cycles may be completed by
manual Practice, online Steady Routine, or a mixture of both.

Refined Technique and Steady Routine improve the route to readiness but are not
additional trial requirements. Mastery is not consumed, and the attempt has no
currency, inventory, energy, ticket, or cooldown cost.

Before readiness, the trial presentation should show:

- The current Training Level and the Level 3 requirement.
- Progress toward 400 Training XP.
- A concise explanation that further training enables the attempt.
- A disabled attempt action that does not imply another hidden requirement.

### Attempt and outcome

Reaching the requirement makes one deliberate `Attempt First Trial` action
available. The trial does not complete automatically when the threshold is
crossed.

The first outcome is deterministic and guaranteed once ready. It contains no
failure chance, random roll, choice, combat resolution, or consumable cost. The
attempt produces concise visible success feedback, then records a permanent
completion milestone. Completion does not spend Training XP or Mastery and does
not award a new currency, item, attribute, or upgrade.

This deliberately small result isolates the design question: does earning and
completing an objective make training feel purposeful? If the answer is no, the
playtest should identify whether the missing ingredient is presentation,
pacing, choice, or reward before any larger system is proposed.

### After completion

The completed trial remains visibly marked and cannot be repeated for rewards.
The only new objective shown is `Reach Training Level 4`. No second trial or
Level 4 reward is promised by this contract.

The existing Practice button and Steady Routine continue operating after
completion. The milestone supplements the current loop; it does not replace or
reset it.

### Persistence

The deterministic foundation stores one `firstTrialCompleted` flag with a safe
default of `false`. Adding the field increments the canonical save format from
version 1 to version 2, following the architecture rule that format changes are
versioned. Version 1 saves migrate field by field without losing existing
progression, selections, inventory, tools, or active gathering state.

The dashboard reads the domain status and dispatches the domain attempt command.
React does not recalculate readiness or mutate the completion flag directly.

### Manual evaluation questions

The implementation playtest must ask:

1. Is the Level 3 readiness requirement understandable before it is reached?
2. Does the period from automation at 275 XP to readiness at 400 XP build
   anticipation, or feel like passive waiting?
3. Does requiring a deliberate attempt make the threshold feel more meaningful
   than an automatic unlock?
4. Does guaranteed success clearly communicate that training enabled the
   result?
5. Is the persistent completion state a satisfying enough payoff for this
   minimal experiment?
6. Does `Reach Training Level 4` provide direction without falsely promising
   content that does not exist?
7. If the trial feels weak, is the problem clarity, pacing, lack of choice, or
   lack of reward?

Automated tests can verify readiness and persistence rules; they cannot answer
these questions.

### Contract exclusions

This contract does not include combat, enemies, health, damage, random failure,
loot, equipment, attributes, locations, a world map, story, repeatable rewards,
a second trial, another currency, or a final theme.

## Accepted design hypothesis: persistent character identity

This bounded experiment asked whether naming one persistent character and
seeing existing growth attached to that identity makes progression feel more
personal. It does not yet ask the player to choose a class, build, origin,
attribute, appearance, or combat role.

The smallest character foundation contains:

- One player-chosen display name, with `Trainee` as neutral default wording.
- One compact Character view using temporary presentation rather than final art.
- Existing Training Level and lifetime Training XP.
- A presentation-only state of `Training in progress` or `Trial proven`, derived
  from the existing First Trial milestone.
- The existing next objective, without another reward or progression rule.

The name changes identity only. The visible growth state is derived rather than
stored and has no effect on Practice, rewards, costs, automation, gathering, or
trial rules. Stable character data must not depend on the eventual theme.

### Character identity evaluation

The foundation passed functional manual evaluation. These questions remain
useful when choosing or evaluating a deeper character step:

1. Does choosing a name create a stronger attachment to the same progression?
2. Is Training Level easier to understand as character growth in this view?
3. Does the visible change after the First Trial feel like the character earned
   a persistent milestone?
4. Does the temporary presentation leave room for a future theme and art style?
5. What feels missing from the personal connection, without assuming that the
   answer must be classes, equipment, combat, or a large customization system?

Automated tests verify identity, derivation, migration, and persistence. They
cannot establish that the character feels personal or rewarding.

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

These values are the recorded design source for the experiment and are mirrored
in the centralized playable-core configuration:

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
After buying it, the player needs eight more completed cycles, exactly twenty
upgraded actions when starting from zero progress, to afford automation. Once
unlocked, automation completes one cycle every five seconds while the
application is open. Fractional progress
is shared by manual and automatic production rather than tracked separately.

Training XP should use the existing XP curve so the player also observes a
level increase during this path. Mastery is spendable; Training XP and completed
cycle totals are lifetime statistics and must not decrease when buying an
upgrade.

These numbers remain pacing hypotheses, not evidence that the loop is fun. Any
future balance issue must state which playtest observation it addresses and
repeat the relevant manual evaluation.

### Follow-up boundaries

The contract is implemented in three small gameplay issues:

1. Add Practice, its shared progress cycle, Mastery, and Training XP.
2. Add Refined Technique using the centralized configuration and deterministic
   purchase rules.
3. Add Steady Routine using elapsed-time production while the application is
   open.

Offline automation, balance expansion, additional upgrades, new currencies,
and final thematic language remain outside those issues. Steady Routine remains
online-only through this milestone so its pacing can be evaluated before any
closed-time rewards are introduced.

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

- What exact fantasy best expresses character growth through training?
- What form should the first meaningful trial take?
- Should its first outcome be fully deterministic or contain one limited choice?
- What visible change should demonstrate that the character became more capable?
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
