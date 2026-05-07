# Test Runner Flow

This project uses Playwright Test (`@playwright/test`) with tests located under `src/`.

The suite is currently built around two main test styles:

- **Traversal-style**: walk through a form end-to-end using the form JSON as the source of truth.
- **Mapping/contract tests**: validate that JSON → runtime mapping produces correct controller/condition instances.

## Playwright configuration

- File: `playwright.config.js`
- Key settings:
  - `testDir: './src'`
  - `reporter: 'html'`
  - `use.baseURL`: derived from environment (`src/config.js`)
  - `use.trace: 'on'`
  - Projects: only `chromium` (Desktop Chrome device profile)

## `form.spec.js`: traversal-style test

- Fixture: `src/data/unicorn.json` (loaded via `fs/promises` + `JSON.parse`).
- Strategy:
  - Compute the form slug from `form.name` (lowercase, spaces to hyphens, remove parentheses).
  - Start at `pages[0].path`.
  - Maintain a `navigationStack` of URLs to visit and a `visitedPaths` set to avoid infinite loops.
  - On each page:
    - Locate the page definition using `findPageByPath(path)`.
    - Handle special controllers:
      - Terminal page controllers end the traversal.
      - Summary controllers are verified and submitted.
    - Otherwise:
      - Initialize component controllers for components on the page.
      - Fill data using a `componentData` map keyed by component type.
      - Navigate forward and push new URLs onto the stack.

Repeat page handling:

- The test includes helpers to recognize repeat page instances (UUID suffix) and repeat summary pages (`/summary`).
- Repeat pages can create multiple instances, so the visited-path tracking treats UUID paths specially.

## `conditions.spec.js`: mapping/contract tests

- Fixture: `src/data/report-death.json`.

Checks performed:

1. Condition mapping correctness

   - Loads all conditions via `createConditionsForForm(form)`.
   - For each condition:
     - Ensures every JSON condition item maps to a runtime item.
     - Ensures `triggerValue` is present and correctly typed.

2. Condition attachment correctness
   - Initializes each component via `ComponentsInitializer.initializeComponent(...)`.
   - Verifies that components have condition items attached when referenced by the form’s conditions.

## Debugging test runs

Useful Playwright commands:

- List tests without running:
  - `npx playwright test --list`
- Run by title/grep:
  - `npx playwright test -g "some title"`
- Run headed:
  - `npx playwright test --headed`
- Debug:
  - `npx playwright test --debug`
- View report:
  - `npx playwright show-report`

## Test outputs

- HTML report output: `playwright-report/`
- Runtime artifacts (screenshots, traces, etc.): `test-results/`

Both of these are generated outputs and are typically not treated as source.
