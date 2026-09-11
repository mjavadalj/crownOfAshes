# SPEC — Narrative Card Authoring & Debug Editor

## 1. Purpose

Build a **desktop-first narrative authoring and debugging tool** for the mobile political decision-card game.

The Editor is the source of truth for:
- Phases
- Stats
- Characters
- Factions
- Events
- Cards
- Choices
- Conditions
- Effects
- Dependencies
- Timeline rules
- Debug states / presets

The Editor must let a content designer create, inspect, test, debug, and export the game's narrative **without opening the game source code**.

The Editor should be powerful internally but deliberately simple to operate. It must **not** become a giant application with hundreds of React states, tiny components, or unnecessary files.

Core principle:

> **High system complexity, low authoring complexity.**

---

## 2. Product Scope

### In scope

The MVP Editor supports:

1. Content authoring
2. Card authoring
3. Visual condition/effect building
4. Characters and factions
5. Events and phases
6. State management and debug mode
7. Card simulation
8. Dependency inspection
9. Story Graph
10. Timeline
11. Validation
12. Search/filtering
13. Import/export
14. Versioned deterministic content

### Explicitly out of scope for MVP

Do not build these unless they become necessary:
- Collaborative multiplayer editing
- Cloud backend
- Real-time multiplayer authoring
- Full analytics platform
- Complex procedural content generation
- Plugin marketplace
- Large asset-management system
- Full visual scripting language
- Dozens of independent editor windows

These can remain future-compatible without being implemented.

---

## 3. Core Principles

### Data-driven
Game content is data, not individually hard-coded game logic.

### Reusable rules
Conditions and effects are composable and represented as data.

### Traceable
The author can always inspect why content is or is not available.

### Testable
Any meaningful game state can be reproduced with a saved State Preset.

### Graph-visible
Important narrative and dependency relationships can be visualized.

### Versionable
Exported content is deterministic and suitable for Git/version control.

### Simple UI
Complexity belongs in the data model and engines, not in a complicated authoring workflow.

### Minimal implementation
Prefer a small number of feature-oriented React components and shared domain utilities over a large component hierarchy.

---

## 4. Recommended Technology

The Editor is a **desktop application**, not a normal website.

Recommended implementation:

```text
Tauri 2
  ↓
React + TypeScript
  ↓
Local project files / JSON
  ↓
Exported content
  ↓
Flutter mobile game
```

### Desktop

- Tauri 2
- React
- TypeScript

### Graph

Use a mature graph library such as React Flow rather than implementing graph interaction from scratch.

### Storage

MVP should use **JSON project/content files as the canonical source format**.

SQLite is optional only if a real performance need appears for indexing/search. Do not introduce a database merely because the Editor is complex.

### Runtime logic

Editor-side domain logic should be plain TypeScript and independent of React UI.

The mobile game remains Flutter/Dart. Its runtime condition/effect implementation should follow the same versioned content schema and be protected against divergence with shared golden test fixtures.

### Important architecture rule

Do not put game logic inside React components.

React is responsible for presentation and authoring interaction. Domain logic belongs in small, testable modules.

---

## 5. Complexity Budget

The Editor must remain a small maintainable application.

### Rules

- Prefer feature-level components over tiny one-purpose components.
- Do not create a component for every label, row, field, or icon.
- Avoid dozens of independent React contexts.
- Avoid duplicated state between views.
- Use one canonical project/content model.
- Use a small number of shared UI primitives.
- Keep domain logic outside React.
- Avoid premature abstractions.
- Do not create a generic framework inside the Editor.

### Recommended conceptual structure

```text
src/
  app/
  components/
  features/
    cards/
    characters/
    factions/
    events/
    phases/
    debug/
    graph/
    timeline/
    validation/
  domain/
    content/
    conditions/
    effects/
    simulation/
    validation/
    dependencies/
  storage/
  styles/
```

This is a conceptual organization, not a requirement to create a large number of files.

A feature may contain only a few files when that is sufficient.

---

## 6. Application Layout

The Editor follows a compact IDE-style layout:

```text
┌───────────────────────────────────────────────────────────────────┐
│ Project   Play   Debug   Validate   Export   Search               │
├───────────────┬─────────────────────────────────┬─────────────────┤
│ Content       │ Workspace                        │ Inspector       │
│               │                                 │                 │
│ Phases        │ Card / Event / Character        │ Properties      │
│ Stats         │ Graph / Timeline / Simulator    │ Conditions      │
│ Characters    │                                 │ Effects         │
│ Factions      │                                 │ Dependencies    │
│ Events        │                                 │                 │
│ Cards         │                                 │                 │
├───────────────┴─────────────────────────────────┴─────────────────┤
│ Status / Validation / Save state                                  │
└───────────────────────────────────────────────────────────────────┘
```

### Three permanent regions

**Left — Content Browser**
- Browse and search content.
- Create, duplicate, delete/archive.
- Filter by type.

**Center — Workspace**
- Displays the current editing view.
- Uses tabs so the author can keep several views open.

**Right — Inspector**
- Properties of the selected entity.
- Conditions.
- Effects.
- Dependencies.
- Validation information.

The same underlying data must be editable from different views without duplication.

---

## 7. Tabs and Navigation

The Editor should feel closer to a lightweight Unity/Unreal-style authoring tool than a collection of separate web pages.

### Workspace tabs

Examples:

```text
[ Card: Noble Demand ] [ Event: Civil War ] [ Story Graph ] [ Timeline ]
```

Tabs can be:
- Opened by double-clicking content.
- Opened from search results.
- Opened from dependency links.
- Closed.
- Reopened from recent items.

Do not open a new application window for normal authoring.

### Breadcrumbs

When useful:

```text
Cards / Noble Demand / Choice A / Effects
```

Clicking a breadcrumb returns to the parent context.

### Fast navigation

- Global search: `Ctrl/Cmd + K`
- Save: `Ctrl/Cmd + S`
- Undo: `Ctrl/Cmd + Z`
- Redo: `Ctrl/Cmd + Shift + Z`
- Duplicate selected: `Ctrl/Cmd + D`
- Delete/archive selected: `Delete`
- Validate: `Ctrl/Cmd + Shift + V`

Exact shortcuts can change during implementation, but the Editor must provide fast keyboard navigation.

---

## 8. Dashboard

Shows:
- Project name
- Content version
- Number of phases
- Number of stats
- Number of characters
- Number of factions
- Number of events
- Number of cards
- Validation errors
- Validation warnings
- Recent changes

Dashboard actions:
- Open project
- Create content
- Continue recent work
- Validate project
- Open Debug Mode

---

## 9. Phase Editor

Initial phases:

```text
Rebellion
Revolution
Fall of the Government
Civil War
Kingdom
Foreign War
Popular Uprisings
Governance
```

Each phase supports:

```text
ID
Name
Description
Order
Artwork
Music
Active Stats
Entry Conditions
Exit Conditions
Available Characters
Available Factions
Available Events
Available Cards
Phase-specific Rules
Time Range
```

Actions:
- Create
- Edit
- Duplicate
- Reorder
- Archive
- Delete when safe
- Open in Story Graph
- Open in Timeline
- Inspect dependencies

---

## 10. Stat Editor

Initial stats:

```text
Popularity   / مقبولیت
Legitimacy   / مشروعیت
Military     / ارتش
Money        / پول
Nobility     / اشراف
Religion     / مذهب
Factions     / جناح های سیاسی
Food         / غذا
```

Each stat supports:

```text
ID
Name
Display Name
Description
Icon
Minimum
Maximum
Default Value
Starting Value
Phase-specific Starting Values
Visible/Hidden
Active/Inactive by Phase
Warning Thresholds
Critical Thresholds
Game Over Rules
```

The author can define when a stat becomes active.

The Editor should show where a stat is used:
- Conditions
- Effects
- Game-over rules
- Timeline/state dependencies

---

## 11. Character Editor

Fields:

```text
ID
Name
Portrait
Description
Role
Faction
Tags
Initial State
Alive/Dead
Loyalty
Relationships
Available Phases
Entry Conditions
Exit Conditions
```

Relationships must support:
- Player ↔ Character
- Character ↔ Character
- Character ↔ Faction

Character state can be changed by card/event effects.

The Inspector should show:

```text
USED BY
→ Cards
→ Events
→ Conditions
→ Effects
```

---

## 12. Faction Editor

Fields:

```text
ID
Name
Description
Icon
Leader
Influence
Loyalty
Tags
Available Phases
Conditions
Events
Cards
```

Faction state must be directly editable in Debug Mode.

---

## 13. Event Editor

An Event is a larger narrative situation that can activate a collection of cards and state changes.

Fields:

```text
ID
Name
Description
Artwork
Phase
Start Conditions
End Conditions
Duration
Priority
Cards
Characters
Factions
Effects
Triggered Events
```

Example:

```text
EVENT: Noble Conspiracy

Start:
phase == kingdom
AND nobility > 70
AND legitimacy < 50

Cards:
- Strange Letters
- Hidden Meeting
- General's Warning
- Arrest the Nobles

End:
conspiracy_exposed == true
OR
conspiracy_success == true
```

Event Inspector should expose:
- Cards belonging to the event.
- Characters involved.
- Factions involved.
- Conditions.
- Effects.
- Incoming/outgoing dependencies.

---

## 14. Card Editor

Cards are the primary authoring unit.

### Basic information

```text
ID
Title
Artwork
Situation Text
Author Notes
Tags
Priority
Weight
Repeatable
Cooldown
```

### Availability

```text
Phase
Event
Day From
Day Until
Conditions
Required Characters
Required Factions
Required Flags
Forbidden Flags
Previous Cards
Previous Choices
```

### Choices

Each card initially has two choices:

```text
Choice A / Swipe Left
Choice B / Swipe Right
```

Each choice contains:

```text
Text
Conditions
Effects
Delayed Effects
Follow-up Cards
Triggered Events
Set Flags
Remove Flags
Unlocks
Locks
Phase Changes
```

### Card authoring UX

The common workflow must be possible on **one card workspace**, without navigating through multiple pages.

Example:

```text
┌──────────────────────────────────────────────┐
│ Noble Demand                         [Save]   │
├──────────────────────────────────────────────┤
│ Situation                                     │
│ [text editor..............................]  │
│                                              │
│ Availability                                 │
│ Phase [Kingdom]  Day [120]–[∞]               │
│ Conditions [+ Add Condition]                 │
│                                              │
│ ── Choice A ──────────────────────────────── │
│ Text [....................................]  │
│ Conditions [+]  Effects [+]  Delayed [+]     │
│                                              │
│ ── Choice B ──────────────────────────────── │
│ Text [....................................]  │
│ Conditions [+]  Effects [+]  Delayed [+]     │
└──────────────────────────────────────────────┘
```

The author should not need to open separate modal pages for every condition or effect. Inline expandable editors are preferred.

---

## 15. Condition Builder

Conditions are built visually and stored as a nested data structure.

Example:

```text
ALL
├── Phase = Kingdom
├── Nobility > 70
├── Legitimacy < 50
└── Character "General" is Alive
```

Supported condition sources include:

```text
Stats
Phase
Day / Time
Events
Characters
Character Relationships
Factions
Flags
Tags
Previous Cards
Previous Choices
History
```

Operators:

```text
=
!=
>
>=
<
<=
contains
exists
is alive
is dead
has tag
has flag
event active
event completed
```

Logical groups:

```text
ALL
ANY
NOT
```

Nested groups are required.

### Condition UX

The author can:
- Add condition.
- Change source.
- Change operator.
- Change value/reference.
- Group conditions.
- Ungroup conditions.
- Duplicate condition.
- Delete condition.
- Reorder conditions.

Use dropdowns and entity pickers instead of requiring the author to type IDs manually.

---

## 16. Effect Builder

Initial effect types:

### Stats

```text
Modify Stat
Set Stat
Clamp Stat
```

### Characters

```text
Modify Loyalty
Modify Relationship
Create Character
Kill Character
Revive Character
Change Character State
```

### Factions

```text
Modify Influence
Modify Loyalty
Create Faction
Change Faction State
```

### Flags

```text
Set Flag
Remove Flag
Toggle Flag
```

### Narrative

```text
Start Event
End Event
Trigger Card
Unlock Card
Lock Card
Change Phase
```

### Time

```text
Advance Days
Set Day
Schedule Effect
```

Every effect can be marked as:
- Immediate
- Delayed / scheduled

The UI should expose the target entity through selectors, not raw string IDs where possible.

---

## 17. Dependency Model

Cards should primarily depend on **world state**, not manual links to previous cards.

Example:

```text
CARD A

Choice:
Promise the Merchants

Effects:
money +30
set flag "merchant_monopoly_promised"
```

Later:

```text
CARD B

Conditions:
phase == kingdom
AND flag "merchant_monopoly_promised"
```

The Editor must infer the relationship between A and B.

Direct explicit links remain available for intentional follow-up relationships.

### Dependency types

```text
Condition dependency
Effect dependency
Trigger
Unlock
Lock
Phase transition
Event membership
Character dependency
Faction dependency
Flag producer
Flag consumer
Stat producer
Stat consumer
```

---

## 18. Dependency Inspector

Every major entity should have a compact dependency view.

Example:

```text
CARD: Merchant Demand

DEPENDS ON
├── Phase: Kingdom
├── Flag: merchant_monopoly_promised
│   └── Produced by: Card #034
├── Faction: Merchants
│   └── Influence > 60
├── Stat: Nobility
│   └── > 70
└── Event: Noble Conspiracy
    └── Active

THIS CONTENT AFFECTS
→ Card #081
→ Card #112
→ Event: Merchant Crisis
→ Faction: Merchants
→ Stat: Money
→ Ending: Economic Collapse
```

Every referenced item should be clickable and open in a workspace tab.

---

## 19. Dependency Matrix

Provide a lightweight table view for large projects.

Example:

```text
                    Cards  Events  Phases  Characters  Factions
Merchant Demand       ✓       ✓       ✓        ✓           ✓
Noble Conspiracy      ✓       —       ✓        ✓           ✓
General Ardan         ✓       ✓       —        —           ✓
```

This is an inspection tool, not a second authoring system.

The matrix should be generated from the canonical data model.

---

## 20. Decision History / State Provenance

The Editor should be able to answer:

> Where did this state value or flag come from?

Example:

```text
merchant_monopoly_promised

CREATED
Day 34
Card #034
Choice: Accept their offer

STILL ACTIVE
Day 143

USED BY
→ Card #081
→ Card #112
→ Event #17
→ Ending #04
```

For a stat:

```text
Money = 42

Recent changes:
Day 141  Card #088  -20
Day 139  Card #076  +35
Day 130  Event #12  -10
```

This can be generated from simulation/history data and does not require a complex event-sourcing architecture in the MVP.

---

## 21. Story Graph

The Editor provides a visual graph containing:
- Cards
- Events
- Phases
- Characters
- Factions

Relationship types:
- Trigger
- Unlock
- Lock
- Condition
- Effect
- Phase transition
- Event membership
- Character dependency
- Faction dependency

Features:
- Pan
- Zoom
- Search
- Filter
- Focus selected node
- Collapse/expand groups
- Highlight incoming dependencies
- Highlight outgoing dependencies
- Open node in editor tab

Example:

```text
REBELLION
   ↓ phase transition
REVOLUTION
   ├── Character: General
   ├── Faction: Merchants
   └── Event: Civil War
             ↓
          Card A
             ↓ effect
merchant_monopoly_promised
             ↓ condition
          Card X
             ↓
         KINGDOM
```

### Graph rule

The graph is a **derived visualization**. Authors do not manually draw narrative connections.

The graph is generated from:
- Conditions
- Effects
- Explicit links
- Event membership
- Phase relationships
- Entity references

---

## 22. Timeline

The Timeline visualizes phase and content availability over time.

Example:

```text
Day 1     Rebellion
Day 30    Revolution
Day 70    Fall of Government
Day 100   Civil War
Day 150   Kingdom
```

Cards and events can define:
- Minimum day
- Maximum day
- Duration
- Scheduled trigger

The Timeline must allow the author to inspect:
- What can be active at a selected day.
- Which phase is active.
- Which events can run.
- Which cards can be available.

Selecting a timeline item opens the related content tab.

---

## 23. Game State Manager

The Editor contains a complete simulated Game State.

Example:

```text
DAY: 143
PHASE: KINGDOM

STATS
Popularity: 72
Legitimacy: 48
Military: 61
Money: 22
Nobility: 83
Religion: 54
Factions: 47
Food: 31

CHARACTERS
General Ardan: Alive
Queen Mira: Alive
Rebel Leader: Dead

FLAGS
merchant_monopoly_promised
army_empowered
royalist_leader_executed

ACTIVE EVENTS
Noble Conspiracy
```

Every editable state property can be inspected and modified in Debug Mode.

The Game State Manager should support snapshots so simulation can safely rollback.

---

## 24. Debug Mode

The author can:

### Jump to Phase

```text
Jump to Phase → Kingdom
```

### Jump to Event

```text
Start Event → Civil War
```

### Change Day

```text
Day = 150
```

### Change Stats

```text
Military = 90
Food = 10
Nobility = 85
```

### Change Characters

```text
General Ardan → Dead
```

### Change Factions

```text
Nobility Influence = 95
```

### Change Flags

```text
merchant_monopoly_promised = true
```

### Draw Next Card

The Card Resolver evaluates the modified state and returns an eligible card.

Debug changes must clearly be marked as temporary until explicitly saved as a preset.

---

## 25. Why? Debugger

Every card must expose an explanation of its availability.

Example:

```text
CARD: Noble Demand

NOT AVAILABLE

✓ Phase = Kingdom
✓ Nobility > 70
✓ Day >= 120
✗ Flag "merchant_monopoly_promised"

Reason:
Required flag is missing.
```

Example available card:

```text
AVAILABLE

✓ Phase = Kingdom
✓ Nobility > 70
✓ Day >= 120
✓ General alive
✓ Noble Conspiracy active
```

The debugger must explain nested condition groups, not merely show the final boolean.

If a card is unavailable because of a nested `ALL` or `ANY`, show which branch failed.

---

## 26. Card Simulation

The author can select a card and run it against the current debug state.

```text
[ SIMULATE ]
```

The Editor displays:

```text
BEFORE
Military: 50
Money: 20

CHOICE
Give the army more gold

AFTER
Military: 50
Money: 5
Army Loyalty: +15

TRIGGERED
Event: Military Pressure
Card unlocked: General's Demand
```

Simulation must support:
- Temporary state
- Rollback
- Testing both choices
- Reset to original state
- Viewing all resulting effects
- Viewing state diff
- Viewing triggered/unlocked/locked content
- Viewing scheduled delayed effects

### State Diff

Example:

```text
BEFORE
Money 50
Popularity 62
Merchants 71

CHOICE
Grant Monopoly

AFTER
Money 80   +30
Popularity 55   -7
Merchants 94   +23

NEW FLAG
merchant_monopoly_promised

UNLOCKED
Merchant Demand

SCHEDULED
Merchant Crisis / Day +60
```

---

## 27. State Presets

Authors can save complete debug states.

Examples:

```text
Early Rebellion
Successful Revolution
Civil War
Weak Kingdom
Powerful Nobility
Military Dictatorship
Famine
Endgame
```

A State Preset is a complete serialized Game State.

The author can load any preset instantly.

Presets should support:
- Create
- Rename
- Duplicate
- Delete
- Load
- Save current state as preset

---

## 28. Validation System

Validation runs continuously and before export.

### Errors

```text
Missing ID
Missing card artwork
Missing choice
Invalid stat reference
Invalid character reference
Invalid faction reference
Invalid event reference
Invalid phase reference
Circular dependency
Unknown flag
Effect references missing entity
Invalid condition structure
Invalid effect structure
```

### Warnings

```text
Potentially unreachable card
Card has extremely low availability
Event has no ending condition
Character never appears
Stat is never modified
Dead-end branch
Unused content
Potential contradictory conditions
Possible missing delayed consequence
```

Errors block export.

Warnings do not necessarily block export.

### Validation UX

The bottom status bar shows:

```text
✓ 0 Errors    ⚠ 3 Warnings
```

Clicking the status opens a validation panel.

Each error/warning is clickable and opens the relevant entity and location.

---

## 29. Search and Filtering

Global search must cover:
- Cards
- Card text
- Characters
- Events
- Phases
- Stats
- Factions
- Flags
- Conditions
- Effects

Filters:
- Phase
- Event
- Character
- Faction
- Stat
- Tag
- Availability
- Errors
- Warnings

Search results should support:
- Open in tab
- Reveal in graph
- Reveal in timeline
- Inspect dependencies

---

## 30. Import / Export

The Editor must support:

```text
New Project
Open Project
Save
Save As
Import Content
Export Content
Export JSON
Import JSON
```

The schema must be versioned.

Example:

```json
{
  "schemaVersion": 1,
  "contentVersion": "0.1.0"
}
```

Export must be deterministic so content changes can be tracked in version control.

### Project format

Prefer a human-readable project structure where practical:

```text
project/
  project.json
  content.json
  assets/
```

The exact file layout may change, but the canonical exported content schema must remain stable.

---

## 31. Runtime Contract

The mobile game consumes Editor output through a stable content schema.

```text
Editor
 ↓
Validator
 ↓
Exporter
 ↓
content.json / content database
 ↓
Mobile Game
 ↓
Runtime State Engine
```

The runtime must not depend on the Editor UI or implementation.

Content schema changes must be versioned.

---

## 32. Runtime Modules

Recommended runtime modules:

```text
ContentRepository
StateManager
ConditionEngine
EffectEngine
CardResolver
EventManager
PhaseManager
CharacterManager
FactionManager
SaveManager
```

### ContentRepository
Loads and indexes exported content.

### StateManager
Owns current Game State, snapshots, saves, and restores.

### ConditionEngine
Evaluates conditions and produces human-readable explanations.

```text
evaluate(condition, state)
explain(condition, state)
```

### EffectEngine
Applies or simulates effects.

```text
apply(effect, state)
simulate(effect, state)
```

### CardResolver
Finds and selects eligible cards.

```text
getEligibleCards(state)
selectCard(state)
```

### EventManager
Starts, updates, and ends events.

### PhaseManager
Handles phase transitions.

---

## 33. Authoring Workflow

The ideal workflow is:

```text
Create Phase
   ↓
Create Stats
   ↓
Create Characters / Factions
   ↓
Create Event
   ↓
Create Cards
   ↓
Add Conditions
   ↓
Add Choices
   ↓
Add Effects
   ↓
Inspect Dependencies
   ↓
Inspect Story Graph / Timeline
   ↓
Validate
   ↓
Create or Load Debug State
   ↓
Simulate
   ↓
Inspect State Diff / Why?
   ↓
Fix
   ↓
Export
```

However, this is a conceptual dependency order, **not a forced UI wizard**.

The author can jump directly from any content item to related content.

---

## 34. Quick Creation UX

Creating common content must be fast.

Examples:

```text
Right-click Cards
→ New Card

Right-click Characters
→ New Character

Right-click Events
→ New Event
```

New entities receive a generated temporary ID and immediately open in an editor tab.

The author should be able to:
- Duplicate existing cards.
- Duplicate events.
- Duplicate characters.
- Copy conditions.
- Copy effects.
- Paste conditions/effects into another card.

This is especially important because the game contains many similar narrative structures.

---

## 35. Undo / Redo and Safe Editing

The Editor must provide:
- Undo
- Redo
- Unsaved-change indicator
- Safe deletion/archive
- Confirmation only for destructive operations
- Automatic preservation of valid data during editing

Normal text edits and condition/effect changes should be undoable.

Simulation must never silently modify the source content.

---

## 36. Asset References

The Editor needs only lightweight asset management in MVP.

For artwork/audio:
- Store references/paths in content data.
- Provide preview when possible.
- Detect missing asset references during validation.
- Do not build a full media library unless required later.

Example:

```text
artwork: assets/cards/noble_demand.png
```

---

## 37. Data Model Rules

All authored entities require stable IDs.

Example:

```text
phase_kingdom
char_general_ardan
faction_merchants
event_noble_conspiracy
card_noble_demand
```

References must use IDs, not duplicated embedded entity definitions.

Conditions and effects are data structures, not executable code.

Example conceptual condition:

```json
{
  "type": "all",
  "children": [
    { "type": "phase", "operator": "eq", "value": "kingdom" },
    { "type": "stat", "id": "nobility", "operator": "gt", "value": 70 }
  ]
}
```

The exact schema can evolve, but it must remain explicit, serializable, deterministic, and versioned.

---

## 38. Source of Truth and Derived Views

Only the canonical content model is authoritative.

These are derived views:
- Story Graph
- Dependency Matrix
- Timeline
- Search index
- Validation results
- Dependency Inspector
- Decision History summaries
- Card availability explanations

Do not maintain separate manually editable copies of these relationships.

This prevents synchronization bugs.

---

## 39. Testing Requirements

The Editor domain layer should have automated tests for:

### Conditions
- Each comparison operator.
- Nested ALL/ANY/NOT.
- Character state.
- Faction state.
- Event state.
- Flags.
- Previous choice/card conditions.

### Effects
- Stat modifications.
- Character state changes.
- Faction changes.
- Flag changes.
- Event triggers.
- Card locks/unlocks.
- Phase changes.
- Delayed effects.

### Simulation
- Snapshot/rollback.
- State diff.
- Both choices.
- Scheduled effects.

### Export
- Deterministic output.
- Schema versioning.
- Invalid content rejection.

Golden test fixtures should be used to keep Editor and Flutter runtime behavior aligned for important condition/effect cases.

---

## 40. Future-Compatible Extensions

The architecture should allow later addition of:
- Localization
- Multiple artwork variants
- Conditional artwork
- Audio/music triggers
- Card rarity
- Procedural card selection
- Analytics
- Playtest recording
- State replay
- Branch comparison
- Content diff viewer
- Collaborative authoring
- Cloud content storage

These must not complicate the MVP implementation unless they are actually needed.

---

## 41. MVP Acceptance Criteria

The Editor MVP is considered complete when an author can:

1. Create a project.
2. Create/edit phases.
3. Create/edit stats.
4. Create/edit characters.
5. Create/edit factions.
6. Create/edit events.
7. Create/edit cards.
8. Create two choices for a card.
9. Build nested conditions visually.
10. Build effects visually.
11. Create delayed effects.
12. Inspect dependencies.
13. Open the Story Graph.
14. Open the Timeline.
15. Jump to any debug state.
16. Save/load State Presets.
17. Ask why a card is unavailable.
18. Simulate both choices.
19. Inspect state differences.
20. Trace where flags/state values came from.
21. Run validation.
22. Fix errors from validation results.
23. Search all authored content.
24. Export deterministic versioned content.
25. Perform all of the above without editing game source code.

### Final UX requirement

The Editor should feel like **one coherent tool**, not 20 disconnected screens.

The author should spend most of their time in:

```text
Content Browser → Workspace Tab → Inspector
```

with Graph, Timeline, Debug, Simulation, Validation, and Dependency tools available as fast secondary views.

The goal is not to make the Editor enormous.

> **Build the smallest application that can comfortably author the full complexity of the game.**
