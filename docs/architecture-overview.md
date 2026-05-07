# Architecture Overview

This repo is a **data-driven Playwright test suite** for Forms Runner.

The core idea is:

1. Load a form definition JSON (as produced by Forms Designer / used by Forms Runner).
2. Map each JSON **component** to a Playwright **controller** (Page Object style).
3. Map each JSON **condition item** to a **condition class** that can generate trigger / non-trigger values.
4. Use those controllers/conditions inside Playwright tests to traverse and validate form flows.

## High-level module map

- `playwright.config.js`

  - Sets Playwright configuration (test directory, reporter, trace, browser project).
  - Computes `baseURL` from environment configuration.

- `src/config.js`

  - Loads `.env` via `dotenv`.
  - Validates and normalizes environment variables using `joi`.

- `src/helpers/components-mapper.js`

  - Central mapping layer that connects JSON → runtime objects.
  - Exposes:
    - `componentsMapper`: component type → controller class
    - `ComponentsInitializer.initializeComponent(...)`: instantiates controllers and attaches lists/conditions
    - `ConditionMapper`: operator → condition class + helpers to build condition instances

- `src/controllers/*`

  - One controller per component type. Each controller encapsulates locators + fill/assert logic.
  - All controllers generally follow the same contract: `find()`, `assertions(expect)`, `fill(value)`.

- `src/conditions/*`

  - `src/conditions/conditions.js`: condition classes implementing `triggerValue` and `nonTriggerValue`.
  - `src/conditions/index.js`: public exports and helpers that proxy to `ConditionMapper`.

- `src/*.spec.js`
  - Playwright tests.
  - `src/form.spec.js`: a traversal-style test driven by a full form JSON.
  - `src/conditions.spec.js`: validates that conditions map correctly and attach to components.

## Data flow

```text
Form JSON (src/data/*.json)
  ├─ pages[].components[]  ──────────────┐
  │                                      │
  │                                      ▼
  │                           ComponentsInitializer
  │                           - chooses controller class
  │                           - instantiates controller
  │                           - attaches list (if componentDefinition.list)
  │                           - attaches conditions (if any reference this component)
  │                                      │
  │                                      ▼
  │                           Component Controller instance
  │                           - find/assert/fill
  │
  └─ conditions[].items[] ───────────────┐
                                         ▼
                              ConditionMapper
                              - operator → condition class
                              - creates condition item instances
                              - provides trigger/non-trigger values
```

## What to change when extending

### Add support for a new component type

1. Create a controller in `src/controllers/` (example pattern: `src/controllers/text-field-controller.js`).
2. Export it from `src/controllers/index.js`.
3. Map the JSON `type` to the controller in `src/helpers/components-mapper.js` (`componentsMapper`).

### Add support for a new condition operator

1. Implement a condition class in `src/conditions/conditions.js`.
2. Add an operator mapping in `ConditionMapper.CONDITION_MAP` in `src/helpers/components-mapper.js`.
3. Add or extend tests in `src/conditions.spec.js`.

## Design decisions

- **Controller per component type** keeps selectors and behavior localized.
- **Mapping layer** (`ComponentsInitializer`/`ConditionMapper`) centralizes JSON → runtime translation.
- **Condition classes produce values** so tests can systematically traverse conditional branches.
- **ESM** (`"type": "module"`) is used throughout; JSON fixture loading uses `fs/promises` + `JSON.parse`.
