# Components & Controllers

This project uses a **controller** (Page Object Model) per component type.

A controller is responsible for:

- Locating the component in the DOM
- Performing standard assertions (`visible`, `enabled`, etc.)
- Filling the component with a provided value (or generating one if required)

## Base classes

Base classes live in `src/controllers/base-field-controller.js`:

- `BaseFieldController`

  - Default `find()` uses `#${name}`.
  - Default `assertions(expect)` checks visible + enabled.
  - Default `fill(value)` calls `locator.fill(value)`.

- `BaseGroupFieldController`

  - For radios/checkboxes groups.
  - Uses `getByRole('group', { name: title })` (fieldset/legend semantics).

- `BaseCompositeFieldController`
  - For composite fields (date parts, address) with multiple inputs.
  - Uses a group/fieldset and expects subclass to provide specific find methods.

## Controller contract

Controllers typically implement some or all of:

- `find()` → returns a Playwright `Locator`
- `assertions(expect)` → validates component is present/usable
- `fill(value)` → inputs data (string/number/object depending on component)
- `clear()` (optional) → clears current input

## Controller registry

The authoritative mapping of form JSON component `type` → controller class is in:

- `src/helpers/components-mapper.js` (`componentsMapper`)

Controllers are exported from:

- `src/controllers/index.js`

## Lists

Some component definitions reference a list ID (e.g. select/radios/autocomplete).

When `componentDefinition.list` is present:

- `ComponentsInitializer.initializeComponent(...)` looks up the list in the form definition.
- It builds a `ListController` and sets `component.list`.

`ListController` (in `src/controllers/list-controller.js`) provides helpers such as:

- `getFirstItem()`, `getAllTexts()`, `findItemByText()`

Controllers can use these helpers to choose a sensible default value when a test doesn’t specify one.

## Examples

### TextField

- File: `src/controllers/text-field-controller.js`
- Special behavior: supports regex-driven value generation.
  - If `schema.regex` is present on the component definition, it generates a matching value via `randexp`.

### SelectField

- File: `src/controllers/select-field-controller.js`
- Locator strategy: `getByRole('combobox', { name: title })`
- Fill behavior:
  - Uses an explicit `value` (label text), otherwise falls back to `list.getFirstItem().text`.

### FileUploadField

- File: `src/controllers/file-upload-field-controller.js`
- Upload strategy:
  - Generates an in-memory file buffer and sets it with `locator.setInputFiles(...)`.
  - Clicks an "Upload file" button and waits for an upload confirmation message.

## Attaching conditions to controllers

During initialization, components can be annotated with conditions that reference them:

- `ComponentsInitializer.initializeComponent(...)` calls `ConditionMapper.getConditionItemsForComponent(...)`
- The result is assigned to `component.conditions` as an array of entries:
  - `{ conditionId, name, coordinator?, itemId, condition }`

This makes it possible to write tests like:

- “Given a component, what condition items depend on it?”
- “What value triggers the condition?”

## Pages

There is an early/placeholder `src/pages/` folder. At the moment:

- `src/pages/form-page.js` defines a minimal `DefaultPage` container.
- `src/pages/repeat-page.js` and `src/pages/summary-page.js` are currently empty.

Most navigation logic today lives directly in `src/form.spec.js`.

If you want to evolve toward a full page-object architecture, `src/pages/` is the natural place to put:

- Page-level locators (Continue/Back/Add another)
- Page-level assertions (heading present, error summary, etc.)
- Repeat-page instance handling
