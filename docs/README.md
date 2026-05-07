# Documentation

This folder contains project documentation for the `forms-runner-tests` Playwright test suite.

## Contents

- [Architecture Overview](architecture-overview.md)
- [Test Runner Flow](test-runner-flow.md)
- [Components & Controllers](components-and-controllers.md)
- [Conditions System](conditions.md)

## Quick orientation

- Tests live under `src/` and are executed by Playwright Test.
- Form definitions (Designer/Runner JSON) live in `src/data/`.
- The project uses a controller pattern: one controller per component type.
- Conditional logic is mapped from JSON conditions into condition-class instances.
