# Test Runner Flow

This project uses Playwright Test (`@playwright/test`) with tests located under `test/`.

The suite is currently built around three main test styles:

- **Static fixture traversal**: walk through a checked-in form definition JSON end-to-end.
- **Managed-form traversal**: load form definitions from Forms Manager using environment-configured form IDs.
- **Mapping/contract tests**: validate that JSON → runtime mapping produces correct controller/condition instances.

## Playwright configuration

- File: `playwright.config.js`
- Key settings:
  - `testDir: './test'`
  - `fullyParallel: true` — tests run in parallel by default
  - `reporter: 'html'` — HTML report generation
  - `use.baseURL`: derived from `config.FORMS_RUNNER_URL` in `test/config.js`
  - `use.trace: 'retain-on-failure'` — traces collected only on test failure
  - `use.video: 'retain-on-failure'` — videos collected only on test failure
  - Top-level `retries`: `1` in CI, `0` locally
  - The `chromium` project currently overrides retries to `1`
  - Projects: only `chromium` (Desktop Chrome device profile, 1920x1080)

## `form.spec.js`: traversal-style test

- Current checked-in fixture: `test/data/map.json` (loaded via `fs/promises` + `JSON.parse`).
- The file contains commented alternatives for swapping to other local fixtures during development.
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

Test location: `test/tests/form.spec.js`

Repeat page handling:

- The test includes helpers to recognize repeat page instances (UUID suffix) and repeat summary pages (`/summary`).
- Repeat pages can create multiple instances, so the visited-path tracking treats UUID paths specially.

## `live-form-manager.spec.js`: managed-form traversal

- Loads form definitions from Forms Manager rather than from a checked-in local JSON fixture.
- Uses environment variables from `test/config.js`:
  - `FORMS_MANAGER_URL`
  - `LIVE_FORM_DEFINITION_IDS`
  - `DRAFT_FORM_DEFINITION_IDS`
  - `TEST_FORM_DEFINITION_IDS`
- Builds journeys dynamically for configured live, draft, and fully-submitted test forms.
- This is the suite currently wired to `npm test` via the package script.

Test location: `test/tests/live-form-manager.spec.js`

## `conditions.spec.js`: mapping/contract tests

- Fixture: `test/data/report-death.json`.
- Test location: `test/tests/conditions.spec.js`

Checks performed:

1. Condition mapping correctness

   - Loads all conditions via `createConditionsForForm(form)`.
   - For each condition:
     - Ensures every JSON condition item maps to a runtime item.

- Ensures `triggerValue` is present, with explicit type checks for list-based strings and numeric conditions.

2. Condition attachment correctness
   - Initializes each component via `ComponentsInitializer.initializeComponent(...)`.
   - Verifies that components have condition items attached when referenced by the form’s conditions.

## Package scripts

- `npm test` runs the repo's default scripted Playwright suite (`live-form-manager.spec.js`).
- `npx playwright test` runs the full suite under `test/`.
- `npm run report` opens the generated HTML report.

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
