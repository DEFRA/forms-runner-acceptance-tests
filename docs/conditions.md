# Conditions System

> This is work in progress and currently supports a subset of condition types. More conditions (`is longer than`, `is shorter than`, etc.) will be added over time.

Forms can contain conditional logic (e.g., show/hide pages based on answers).

This repo maps condition definitions from the form JSON into **condition instances** that can produce:

- `triggerValue`: a value that should make the condition evaluate to true
- `nonTriggerValue`: a value that should make the condition evaluate to false

These values are used to drive automated traversal through conditional branches.

## Where conditions are defined

Form JSON contains conditions under `conditions[]`:

- Each condition has an `id` and a `displayName`.
- Each condition contains `items[]` (one or more condition items).
- Multi-item conditions typically include a `coordinator` (e.g. `and`).

## Mapping layer

Condition mapping is implemented in `src/helpers/components-mapper.js`:

- `ConditionMapper.CONDITION_MAP` maps operator strings to classes.
  - Supported operators include:
    - `is`
    - `is not`
    - `is more than`
    - `is less than`
    - `is at least`
    - `is at most`

### Single item vs multi-item conditions

- If `items.length === 1`, `ConditionMapper.createCondition(...)` returns a single condition instance.
- If `items.length > 1`, it returns a composite wrapper:
  - `{ id, name, coordinator, items: [conditionInstance, ...] }`

Tests should treat both shapes as valid. A common pattern is:

- “If it has `.items` treat it as composite, otherwise treat it as a single item.”

## Condition classes

Condition classes live in `src/conditions/conditions.js`.

Each class is designed to be a pure data object with computed properties.

### `IsCondition`

Supports these `type` values:

- `ListItemRef`

  - Uses a `ListController` to translate `value.itemId` into list item text.
  - `triggerValue` = selected item text
  - `nonTriggerValue` = a different item’s text

- `NumberValue`

  - `triggerValue` = the numeric value
  - `nonTriggerValue` = a different numeric value (value + 1)

- `BooleanValue`
  - `triggerValue` = boolean value
  - `nonTriggerValue` = opposite boolean

### Numeric threshold operators

`IsMoreThanCondition`, `IsLessThanCondition`, `IsAtLeastCondition`, `IsAtMostCondition` support numeric comparisons.

- `triggerValue` is chosen to satisfy the inequality.
- `nonTriggerValue` is chosen to violate it.

## Attaching conditions to components

During component initialization, `ComponentsInitializer.initializeComponent(...)` attaches any condition items that reference the component:

- Each attached entry includes `conditionId`, `name`, and the instantiated `condition`.
- This allows tests to discover “which answers control which pages/components”.

## Testing condition mapping

`src/conditions.spec.js` verifies:

- Every condition item in the JSON maps to a runtime instance.
- Trigger values are non-null and have expected types (string vs number).
- Condition items are attached to the relevant component controllers.

## Extending the system

To support a new `type` (value type) or operator:

1. Add logic in the relevant condition class (or create a new one).
2. Add the operator mapping in `ConditionMapper.CONDITION_MAP`.
3. Add fixtures and a test in `src/conditions.spec.js`.
