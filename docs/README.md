# Documentation

This folder contains project documentation for the `forms-runner-acceptance-tests` Playwright test suite.

## Contents

- [**How To Guides**](HOWTO.md) — Step-by-step instructions for common tasks
- [**Best Practices**](BEST-PRACTICES.md) — Working conventions for tests and controllers
- [**Troubleshooting Guide**](TROUBLESHOOTING.md) — Common failures and how to diagnose them
- [Architecture Overview](architecture-overview.md) — High-level design and runtime mapping
- [Test Runner Flow](test-runner-flow.md) — How the different suites are executed
- [Components & Controllers](components-and-controllers.md) — Controller pattern and registry
- [Conditions System](conditions.md) — Condition mapping and trigger/non-trigger values

## Quick Orientation

- Tests live under `test/` and are executed with Playwright Test.
- Form definition fixtures live under `test/data/`.
- Controllers live under `test/controllers/`.
- Conditions live under `test/conditions/`.
- `npx playwright test` runs the full Playwright suite.
- `npm test` currently runs the managed-form journey suite in `test/tests/live-form-manager.spec.js`.

## Getting Started

1. **New to the project?** Start with [Architecture Overview](architecture-overview.md).
2. **Need the big picture?** Read [Test Runner Flow](test-runner-flow.md).
3. **Adding or changing behaviour?** Use the [How To Guides](HOWTO.md).
4. **Writing maintainable tests?** Read [Best Practices](BEST-PRACTICES.md).
5. **Something failing mysteriously?** Check [Troubleshooting Guide](TROUBLESHOOTING.md).
