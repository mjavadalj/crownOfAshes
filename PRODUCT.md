# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React + TypeScript + Vite as a desktop-first editor prototype that can later be wrapped by Tauri 2.

## Users

Content designers and narrative/gameplay designers authoring the data for a mobile political decision-card game.

## Product Purpose

The editor is the source of truth for phases, stats, characters, factions, events, cards, choices, conditions, effects, dependencies, debug states, and exports. It lets authors create, inspect, simulate, validate, and export narrative content without editing game source code.

## Positioning

High system complexity with low authoring complexity: the canonical content model carries the complexity while the author works primarily through a content browser, one workspace tab, and an inspector.

## Operating Context

Desktop-first IDE-style workflow for a swipe-based mobile political narrative game. Authors need quick navigation, inline condition/effect editing, deterministic JSON-friendly data, debug presets, dependency tracing, and simulation of both card choices.

## Capabilities and Constraints

- Initial game progression: Rebellion, Revolution, Fall of the Government, Civil War, Kingdom, Foreign War, Popular Uprisings, Governance.
- Initial stats, characters, factions, events, cards, conditions, effects, delayed consequences, validation, graph, timeline, debug mode, search, and versioned export are in scope.
- The MVP uses a canonical in-memory content model with local persistence; derived views are generated from that model.
- The first implementation is intentionally small and avoids cloud collaboration, analytics, a full asset library, and a visual scripting language.

## Brand Commitments

The product is for the Crown of Ashes project. The interface should feel like a serious narrative tool with a restrained political-archive atmosphere rather than a consumer dashboard.

## Evidence on Hand

- `docs/card_authoring_editor_spec_final.md` is the editor specification.
- `docs/game_prd.md` is the game product requirements document.
- No existing application code or visual system was present in the repository.

## Product Principles

- Data-driven content is the source of truth.
- Conditions and effects must remain explicit, inspectable, and serializable.
- Derived views should explain why content is available or unavailable.
- Simulation must be reversible and never silently mutate source content.
- Authoring should feel like one coherent tool rather than disconnected screens.

## Accessibility & Inclusion

The editor needs visible focus states, keyboard-friendly controls, meaningful labels, clear validation text, and sufficient contrast for long authoring sessions.
