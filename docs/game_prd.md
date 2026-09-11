# PRD — Rebellion to Kingdom

## 1. Product Overview

A mobile narrative strategy game built around swipe-based decision cards. The player begins not as a king, but as the leader of a rebellion against an existing regime. Through a sequence of decisions, the rebellion can become a revolution, overthrow the government, enter civil war, and eventually establish a new kingdom.

The central narrative idea is that **the player creates the political problems they will later have to govern**. Decisions made during the rebellion can return as consequences after the player becomes ruler.

Core progression:

**Rebellion → Revolution → Fall of the Government → Civil War → Kingdom → Foreign War → Popular Uprisings → Governance**

The game is content-driven. Cards, characters, factions, phases, events, conditions, effects, dependencies, and narrative branches are authored in a dedicated Editor and consumed by the game runtime.

---

## 2. Core Player Fantasy

The player experiences the complete political lifecycle of a revolutionary leader:

1. Build a rebellion.
2. Gain popular and military support.
3. Make compromises to survive and win.
4. Overthrow the existing government.
5. Survive the consequences of revolution.
6. Become the new ruler.
7. Discover that promises, alliances, enemies, and compromises from the revolution still exist.
8. Balance competing powers while governing.
9. Decide what kind of ruler the player ultimately becomes.

The game should avoid simple good/evil choices. Most decisions should involve competing interests and delayed consequences.

---

## 3. Core Gameplay Loop

1. A decision card appears.
2. The player reads the situation.
3. The player swipes left or right.
4. The selected choice applies effects to the current world state.
5. Characters, factions, flags, stats, events, and future card availability may change.
6. The game advances time.
7. The Card Resolver selects another eligible card.
8. Certain combinations of state trigger events or phase transitions.
9. Previous decisions may produce delayed consequences much later.

---

## 4. Phases

The initial phase system contains:

1. **Rebellion** — The player leads a resistance movement.
2. **Revolution** — The rebellion becomes a broader revolutionary movement.
3. **Fall of the Government** — The old regime collapses and competing powers fight over the future.
4. **Civil War** — Revolutionary factions and remnants of the old regime compete for control.
5. **Kingdom** — The player has established a new government and becomes its ruler.
6. **Foreign War** — External powers challenge the new state.
7. **Popular Uprisings** — Internal dissatisfaction threatens the new regime.
8. **Governance** — The player manages the long-term consequences of their rule.

Phases are data-defined and editable through the Editor. A playthrough does not necessarily need to visit every phase.

Each phase can define:
- Entry conditions
- Exit conditions
- Active stats
- Available characters
- Available factions
- Available events
- Available cards
- Phase-specific rules
- Art/audio references
- Time range

---

## 5. Core Stats

The initial eight stats are:

| ID | Persian Name | Purpose |
|---|---|---|
| popularity | مقبولیت | Public support and willingness of people to support the player or government |
| legitimacy | مشروعیت | Perceived political/legal right to rule |
| military | ارتش | Military strength and military loyalty |
| money | پول | Treasury and financial resources |
| nobility | اشراف | Influence and power of aristocratic groups |
| religion | مذهب | Influence of religious institutions and believers |
| factions | جناح های سیاسی | Balance and influence of political factions |
| food | غذا | Food supply and ability to sustain the population and army |

Stats can be inactive or hidden in early phases. For example, Money may become relevant only after the rebellion develops into a revolution.

Each stat supports:
- Minimum
- Maximum
- Starting value
- Phase-specific starting value
- Visibility
- Active/inactive state
- Warning thresholds
- Critical thresholds
- Effects
- Conditions
- Game-over rules

---

## 6. Characters

Characters are persistent entities that can appear across multiple cards and phases.

Examples:
- General
- Revolutionary leader
- Noble
- Priest
- Merchant
- Farmer representative
- Rival revolutionary
- Foreign ruler
- Spy master

A character can have:
- ID
- Name
- Portrait
- Description
- Role
- Faction
- Tags
- Alive/dead state
- Loyalty
- Relationships
- Personal flags
- First appearance
- Conditions for appearance
- Events
- Cards

Characters remember relevant previous interactions through state variables, flags, relationships, and history.

---

## 7. Factions

Political and social groups are first-class entities.

Examples:
- Army
- Nobility
- Religious institutions
- Farmers
- Merchants
- Revolutionary radicals
- Moderates
- Royalists

A faction can have:
- ID
- Name
- Description
- Leader
- Influence
- Loyalty
- Tags
- Active phases
- Conditions
- Events
- Cards

The `factions` stat represents the broader balance of political power, while individual factions provide more detailed state.

---

## 8. Events

Events represent larger situations containing or triggering multiple cards.

Examples:
- Revolution Begins
- Government Falls
- Civil War
- Coronation
- Noble Conspiracy
- Famine
- Foreign Invasion
- Popular Uprising

Events can:
- Start when conditions are met
- End when conditions are met
- Run for a duration
- Activate a group of cards
- Disable other cards
- Modify stats
- Change characters
- Change faction states
- Set/remove flags
- Trigger other events
- Change phase

---

## 9. Cards

Cards are the primary player-facing decision units.

A card contains:
- ID
- Title
- Artwork
- Situation text
- Tags
- Phase requirements
- Event requirements
- Day/time requirements
- Conditions
- Character requirements
- Faction requirements
- Required flags
- Forbidden flags
- Previous-choice requirements
- Repeatability
- Cooldown
- Priority/weight
- Choices

The initial mobile interface uses two choices:

**Swipe Left — Choice A**

**Swipe Right — Choice B**

Each choice contains:
- Text
- Conditions
- Immediate effects
- Delayed effects
- Flag changes
- Card unlocks
- Card locks
- Event triggers
- Phase changes
- Follow-up state changes

---

## 10. Conditions

Conditions determine whether content is available or whether an effect executes.

Supported condition sources:
- Stats
- Phase
- Day/time
- Events
- Characters
- Character relationships
- Factions
- Flags/tags
- Previous cards
- Previous choices
- History

Logical operators:
- ALL / AND
- ANY / OR
- NOT

Examples:

```text
phase == kingdom
AND
nobility > 70
AND
legitimacy < 50
AND
character.general.alive == true
```

---

## 11. Effects

Effects modify the world state.

Examples:

```text
military +10
money -20
popularity -5
character.general.loyalty -15
set flag "promised_land"
kill character "royalist_leader"
start event "noble_conspiracy"
unlock card "noble_demand"
change phase "kingdom"
```

Effects can be immediate or scheduled for later.

---

## 12. Delayed Consequences

Delayed consequences are a core design pillar.

Example:

During Rebellion:

> A merchant offers weapons in exchange for exclusive trade rights after victory.

The player accepts.

State changes:
- Money +30
- `merchant_monopoly_promised = true`

Much later, during Kingdom:

> The Merchant Council demands the monopoly they were promised.

The card becomes available because the current world state satisfies its conditions.

The system should therefore model consequences through state, rather than requiring direct hard-coded links between specific cards.

---

## 13. Phase Transitions

Phase changes are driven by conditions and/or events.

Example:

```text
IF
military >= 70
AND popularity >= 60
AND government_stability <= 10

THEN
phase = revolution
start event = government_fall
```

A phase transition may:
- Activate new stats
- Activate new card pools
- Disable old cards
- Unlock characters
- Unlock factions
- Start events
- Change rules

---

## 14. Endings

Endings are data-driven rather than hard-coded.

Potential endings include:
- Revolution defeated
- Military dictatorship
- Successful kingdom
- Civil war collapse
- Famine collapse
- Noble takeover
- Religious takeover
- Popular revolution
- Foreign conquest
- Tyrannical ruler
- Reformist ruler

Endings may depend on combinations of state rather than one stat.

---

## 15. Replayability

Replayability comes from:
- Branching phases
- Different factions
- Character survival/death
- Delayed consequences
- Different alliances
- Different political paths
- Hidden events
- Multiple endings
- Rare cards
- State-dependent card variants

---

## 16. Data-Driven Requirement

The game must not require source-code changes to add or modify:
- Cards
- Choices
- Conditions
- Effects
- Events
- Characters
- Factions
- Phases
- Stats

The Editor exports machine-readable content, such as JSON or a versioned database, which the game runtime loads.

Architecture:

```text
Editor
  ↓
Content Data
  ↓
Validation
  ↓
Export
  ↓
Game Runtime
  ↓
State Manager
  ↓
Condition Engine
  ↓
Card Resolver
  ↓
Effect Engine
```

---

## 17. MVP

The first vertical slice should include:
- Rebellion phase
- Kingdom phase
- At least four active stats
- 10–20 cards
- 3–5 characters
- 2–3 factions
- 2–3 events
- Conditions
- Effects
- Phase transition
- At least one delayed consequence
- Save/load state
- Debug state editing
- Editor export/import

The MVP proves that content authored in the Editor can become playable without hard-coded card logic.
