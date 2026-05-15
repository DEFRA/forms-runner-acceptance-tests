# How To Guides

This document provides step-by-step instructions for common tasks when working with the forms-runner-acceptance-tests project.

## Table of Contents

- [How to Add a New Component Type](#how-to-add-a-new-component-type)
- [How to Add a New Test](#how-to-add-a-new-test)
- [How to Add a New Condition Operator](#how-to-add-a-new-condition-operator)
- [How to Create a New Form Definition](#how-to-create-a-new-form-definition)
- [How to Debug Tests](#how-to-debug-tests)
- [How to Run Tests](#how-to-run-tests)
- [How to Test Specific Components](#how-to-test-specific-components)
- [How to Handle Conditional Logic](#how-to-handle-conditional-logic)
- [How to Work with Lists](#how-to-work-with-lists)
- [How to Extend BaseFieldController](#how-to-extend-basefieldcontroller)

---

## How to Add a New Component Type

When Forms Designer adds a new field component type, you need to create a corresponding controller so the test suite can interact with it.

### Step 1: Create the Controller Class

Create a new file in `test/controllers/` named after the component type:

**File: `test/controllers/my-custom-field-controller.js`**

```javascript
import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for MyCustomField components.
 * Extends BaseFieldController with custom behavior if needed.
 */
export class MyCustomFieldController extends BaseFieldController {
  /**
   * Override find() if your component has a non-standard selector.
   * By default, BaseFieldController uses #${name}
   */
  find() {
    // Example: if the component uses data-testid instead of id
    return this.page.locator(`[data-testid="${this.name}"]`)
  }

  /**
   * Override fill() to handle your component's specific input method.
   * @param {string|number|object} value - The value to enter
   * @returns {Promise<this>}
   */
  async fill(value) {
    // Your custom fill logic here
    await this.find().fill(value)
    return this
  }

  /**
   * Override assertions() if you need custom validation.
   * @param {object} expect - Playwright expect function
   * @returns {Promise<void>}
   */
  async assertions(expect) {
    // Call parent assertions
    await super.assertions(expect)

    // Add custom assertions
    await expect(this.find()).toBeVisible()
  }
}
```

### Step 2: Export the Controller

Add your controller to the exports in `test/controllers/index.js`:

```javascript
export { MyCustomFieldController } from './my-custom-field-controller.js'
```

### Step 3: Map the Component Type to the Controller

Update `test/helpers/components-mapper.js` in the `componentsMapper` object:

```javascript
const componentsMapper = {
  // ... existing mappings ...
  MyCustomField: MyCustomFieldController
  // ... rest of mappings ...
}
```

The key must exactly match the `type` field in the form JSON definition.

### Step 4: Add Test Data

In `test/tests/form.spec.js`, add an entry to the `componentData` map:

```javascript
const componentData = {
  // ... existing entries ...
  MyCustomField: ['sample-value-for-your-component']
  // ... rest of entries ...
}
```

### Step 5: Create Unit Tests (Optional but Recommended)

Create a test file: `test/tests/my-custom-field-controller.spec.js`

```javascript
import { test, expect } from '@playwright/test'
import { MyCustomFieldController } from '../controllers/my-custom-field-controller.js'

test.describe('MyCustomFieldController', () => {
  let page
  let controller

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    controller = new MyCustomFieldController({
      title: 'My Field',
      page,
      name: 'myField',
      type: 'MyCustomField'
    })
  })

  test('should find the component', async () => {
    // Your assertions here
  })

  test('should fill the component', async () => {
    // Your assertions here
  })
})
```

### Key Points

- Always extend `BaseFieldController` unless you have a specific reason not to
- Ensure your `find()` selector accurately targets the DOM element
- Use `this.page` to access the Playwright page instance
- The controller name key in `componentsMapper` must match the form JSON `type` exactly
- Make fill logic robust: handle both trigger and non-trigger values

---

## How to Add a New Test

### Simple: Add a Test to an Existing Spec File

1. Open the relevant test file, e.g., `test/tests/form.spec.js`
2. Add a new `test()` or `test.describe()` block:

```javascript
test('should display an error when the form is submitted without required fields', async ({
  page
}) => {
  await page.goto('/form-slug')

  // Your test logic here
  const submitButton = page.getByRole('button', { name: /submit/i })
  await submitButton.click()

  // Assert the error appears
  await expect(page.locator('[role="alert"]')).toBeVisible()
})
```

### Complex: Create a New Spec File

For a focused test suite on a specific feature or component:

**File: `test/tests/my-feature.spec.js`**

```javascript
import { test, expect } from '@playwright/test'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup; uses the baseURL configured in playwright.config.js
    await page.goto('/my-form-slug')
  })

  test('should allow users to do X', async ({ page }) => {
    // Test 1
  })

  test('should validate Y correctly', async ({ page }) => {
    // Test 2
  })

  test('should show error when Z is invalid', async ({ page }) => {
    // Test 3
  })
})
```

### Test Best Practices

1. **Use Semantic Queries**: Prefer `getByRole()`, `getByLabel()`, `getByText()` over CSS selectors
2. **Descriptive Names**: Use clear test titles that describe the expected behavior
3. **Arrange-Act-Assert**: Structure tests with setup, action, and assertion phases
4. **Use Page Objects**: Create controller/page object classes rather than inline selectors
5. **Avoid Hard-Waits**: Use Playwright's auto-waiting instead of `page.waitForTimeout()`

Example of good test structure:

```javascript
test('should calculate rental price when user enters days', async ({
  page
}) => {
  // Arrange
  const daysInput = page.getByLabel('Number of Days')
  const priceDisplay = page.getByTestId('total-price')

  // Act
  await daysInput.fill('5')

  // Assert
  await expect(priceDisplay).toContainText('£500')
})
```

---

## How to Add a New Condition Operator

Conditions in Forms Runner control the visibility/enablement of form components. If a new operator is added to Forms Designer, you need to:

### Step 1: Create the Condition Class

Condition classes live in `test/conditions/`. Create a new file for your operator:

**File: `test/conditions/is-equals-condition.js`**

```javascript
/**
 * Condition class for a hypothetical 'equals' operator.
 * Match the constructor shape used by ConditionMapper.createConditionItem().
 */
export class IsEqualsCondition {
  constructor({ page, id, name, operator, componentId, value, type, list }) {
    this.page = page
    this.id = id
    this.name = name
    this.operator = operator
    this.componentId = componentId
    this.value = value
    this.type = type
    this.list = list
  }

  get triggerValue() {
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value : null
    }

    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? this.value : null
    }

    if (this.type === 'ListItemRef') {
      return this.list?.getItem(this.value.itemId)?.text ?? null
    }

    return null
  }

  get nonTriggerValue() {
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value + 1 : null
    }

    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? !this.value : null
    }

    if (this.type === 'ListItemRef') {
      return (
        this.list?.getAllItems().find((item) => item.id !== this.value.itemId)
          ?.text ?? null
      )
    }

    return null
  }
}
```

### Step 2: Export the Condition Class

Add to `test/conditions/index.js`:

```javascript
export { IsEqualsCondition } from './is-equals-condition.js'
```

### Step 3: Map the Operator to the Condition Class

In `test/helpers/components-mapper.js`, update the `ConditionMapper` class:

```javascript
class ConditionMapper {
  static CONDITION_MAP = {
    // ... existing operators ...
    equals: IsEqualsCondition
    // ... rest of operators ...
  }

  // ... rest of the class ...
}
```

### Step 4: Add Tests for Your Condition

**File: `test/tests/conditions.spec.js`** (add a focused `test()` alongside the existing checks):

```javascript
test('IsEqualsCondition should generate trigger and non-trigger values', async () => {
  const list = new ListController({
    id: 'country-list',
    name: 'countries',
    title: 'Countries',
    type: 'string',
    items: [
      { id: 'country-uk', text: 'United Kingdom', value: 'United Kingdom' },
      { id: 'country-us', text: 'United States', value: 'United States' }
    ]
  })

  const condition = new IsEqualsCondition({
    id: 'cond-1',
    name: 'Country is UK',
    operator: 'equals',
    componentId: 'country',
    value: { itemId: 'country-uk', listId: 'country-list' },
    type: 'ListItemRef',
    list
  })

  expect(condition.triggerValue).toBe('United Kingdom')
  expect(condition.nonTriggerValue).toBe('United States')
})
```

### Key Points

- `triggerValue`: Must return a value that satisfies the condition
- `nonTriggerValue`: Must return a value that does NOT satisfy the condition
- Both properties must return appropriate types (string, number, etc.)
- Match the constructor signature used by `ConditionMapper.createConditionItem()`
- Keep logic simple and deterministic

---

## How to Create a New Form Definition

Form definitions are JSON files that describe the structure of a form. They live in `test/data/`.

### Step 1: Create the JSON File

**File: `test/data/my-form.json`**

```json
{
  "name": "My Test Form",
  "engine": "V2",
  "schema": 2,
  "startPage": "/personal-details",
  "pages": [
    {
      "id": "personal-details-page",
      "path": "/personal-details",
      "title": "Personal details",
      "components": [
        {
          "id": "first-name",
          "title": "First name",
          "type": "TextField",
          "name": "firstName",
          "options": { "required": true },
          "schema": {}
        },
        {
          "id": "country",
          "title": "Country",
          "type": "SelectField",
          "name": "country",
          "list": "country-list",
          "options": { "required": true },
          "schema": {}
        }
      ],
      "next": []
    },
    {
      "id": "summary-page",
      "path": "/summary",
      "title": "Check your answers",
      "controller": "SummaryPageWithConfirmationEmailController",
      "components": [],
      "next": []
    }
  ],
  "lists": [
    {
      "id": "country-list",
      "name": "countries",
      "title": "Countries",
      "type": "string",
      "items": [
        {
          "id": "country-uk",
          "text": "United Kingdom",
          "value": "United Kingdom"
        },
        {
          "id": "country-us",
          "text": "United States",
          "value": "United States"
        }
      ]
    }
  ],
  "conditions": [
    {
      "id": "show-if-uk",
      "displayName": "Show if country is UK",
      "items": [
        {
          "id": "cond-item-1",
          "componentId": "country",
          "operator": "is",
          "value": {
            "itemId": "country-uk",
            "listId": "country-list"
          },
          "type": "ListItemRef"
        }
      ]
    }
  ]
}
```

### Step 2: Use the Form in Tests

In `test/tests/form.spec.js`, update the form loading:

```javascript
const allComponentsForm = JSON.parse(
  await readFile(new URL('../data/my-form.json', import.meta.url), 'utf8')
)
```

### Form Definition Structure

- **pages**: Array of form pages

  - **path**: URL path segment for the page
  - **title**: Page heading
  - **components**: Array of form fields
  - **controller** (optional): Custom page controller (e.g., SummaryPageController)

- **components**: Individual form fields

  - **id**: Unique identifier
  - **type**: Component type (must have a controller)
  - **title**: Field label
  - **name**: HTML name attribute
  - **options.required**: Whether field is mandatory
  - **list** (optional): Reference to a list ID for select/radio/checkbox components

- **lists**: Dropdown/radio/checkbox options

  - **id**: List identifier
  - **items**: Array of { id, text, value }

- **conditions**: Conditional visibility/enablement logic
  - **items**: Condition evaluation rules

---

## How to Debug Tests

### Using Playwright Inspector

Stop test execution at a breakpoint and open the Playwright Inspector:

```bash
npx playwright test --debug
```

Then in your test:

```javascript
test('my test', async ({ page }) => {
  await page.goto('/form')
  await page.pause() // Execution pauses here; inspector opens
  // Now you can interact with the page and inspect elements
})
```

### View Test Report

After tests run:

```bash
npx playwright show-report
```

This opens an HTML report with:

- Test results and timing
- Screenshots at failure points
- Video recordings (if enabled)
- Traces with full DOM/network inspection

### Add Debugging Logs

Add simple logging in your test:

```javascript
test('debug example', async ({ page }) => {
  console.log('Starting test')
  await page.goto('/form')
  console.log('Page loaded, URL:', page.url())

  const field = page.getByLabel('My Field')
  console.log('Field visible:', await field.isVisible())

  await field.fill('value')
  console.log('Field filled successfully')
})
```

Run with:

```bash
npx playwright test --grep "debug example"
```

Output appears in the console.

### Trace Viewer

Enable traces to inspect network requests, DOM changes, and console logs:

**In `playwright.config.js`:**

```javascript
use: {
  trace: 'on',  // Always record
  // or
  trace: 'on-first-retry',  // Only on failure retries
}
```

View a trace:

```bash
npx playwright show-trace test-results/trace.zip
```

### Screenshot/Video on Failure

**In `playwright.config.js`:**

```javascript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

---

## How to Run Tests

### Run the Full Playwright Suite

```bash
npx playwright test
```

### Run the Repo's Default npm Script

```bash
npm test
```

This currently runs the managed-form journey suite in `test/tests/live-form-manager.spec.js`.

### Run Tests in a Specific File

```bash
npx playwright test test/tests/form.spec.js
```

### Run Tests Matching a Pattern

```bash
# Tests with "conditions" in the title
npx playwright test -g "conditions"

# Tests with "My Feature" in the suite name
npx playwright test -g "My Feature"
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests for a Specific Browser

```bash
npx playwright test --project chromium
```

At the moment, only the `chromium` project is configured in `playwright.config.js`.

### List All Tests Without Running

```bash
npx playwright test --list
```

### Run with Specific Configuration

```javascript
// Skip a test
test.skip('should skip this', async () => {
  // ...
})

// Run only this test (useful for debugging)
test.only('debug this one', async () => {
  // ...
})

// Run a describe block serially when shared state makes that necessary
test.describe.configure({ mode: 'serial' })
```

Retries are configured in `playwright.config.js`.

---

## How to Test Specific Components

### Test a TextField with Regex

**Form Definition:**

```json
{
  "id": "postcode-field",
  "title": "Postcode",
  "type": "TextField",
  "name": "postcode",
  "schema": {
    "regex": "^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$"
  }
}
```

**Test:**

```javascript
test('TextField should generate values matching regex', async ({ page }) => {
  const field = new TextFieldController({
    title: 'Postcode',
    page,
    name: 'postcode',
    type: 'TextField',
    schema: { regex: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$' }
  })

  await field.fill(undefined) // Will use regex generation
  // TextFieldController uses randexp to generate matching values
})
```

### Test a SelectField with Lists

**Form Definition:**

```json
{
  "id": "country",
  "title": "Select Country",
  "type": "SelectField",
  "name": "country",
  "list": "country-list"
}
```

**Test:**

```javascript
test('SelectField should select from list', async ({ page }) => {
  const list = new ListController({
    id: 'country-list',
    name: 'countries',
    items: [
      { id: 'uk', text: 'United Kingdom', value: 'uk' },
      { id: 'us', text: 'United States', value: 'us' }
    ]
  })

  const field = new SelectFieldController({
    title: 'Select Country',
    page,
    name: 'country',
    type: 'SelectField',
    list
  })

  await field.fill('United Kingdom')
})
```

### Test DatePartsField

**Controller handles array input:**

```javascript
const dateField = new DatePartsFieldController({
  title: 'Date of Birth',
  page,
  name: 'dateOfBirth',
  type: 'DatePartsField'
})

await dateField.fill(['01', '01', '2000']) // [day, month, year]
```

### Test FileUploadField

**Controller generates files on-the-fly:**

```javascript
const fileField = new FileUploadFieldController({
  title: 'Upload Document',
  page,
  name: 'document',
  type: 'FileUploadField'
})

await fileField.fill() // Generates test file automatically
```

---

## How to Handle Conditional Logic

Conditions control when components are visible or enabled.

### Test a Conditional Component

**Form Definition with Conditions:**

```json
{
  "id": "pet-type",
  "title": "Type of Pet",
  "type": "SelectField",
  "name": "petType",
  "list": "pet-types"
}
```

After selecting "Dog":

```json
{
  "id": "breed",
  "title": "Dog Breed",
  "type": "TextField",
  "name": "breed",
  "conditions": ["show-if-dog"]
}
```

**Test:**

```javascript
test('should show breed field only when dog is selected', async ({ page }) => {
  const petTypeController = new SelectFieldController({...})
  const breedController = new TextFieldController({...})

  // Initially breed should be hidden
  await expect(breedController.find()).not.toBeVisible()

  // Select Dog
  await petTypeController.fill('Dog')

  // Now breed field should be visible
  await expect(breedController.find()).toBeVisible()
})
```

### Use Trigger/Non-Trigger Values

```javascript
test('should traverse conditional branches', async () => {
  const list = new ListController({
    id: 'pet-types',
    name: 'petTypes',
    title: 'Pet types',
    type: 'string',
    items: [
      { id: 'dog-item', text: 'Dog', value: 'Dog' },
      { id: 'cat-item', text: 'Cat', value: 'Cat' }
    ]
  })

  const condition = new IsCondition({
    id: 'show-if-dog',
    name: 'Show breed when dog is selected',
    operator: 'is',
    componentId: 'pet-type',
    value: { itemId: 'dog-item', listId: 'pet-types' },
    type: 'ListItemRef',
    list
  })

  const triggerValue = condition.triggerValue // 'Dog'
  const nonTriggerValue = condition.nonTriggerValue // 'Cat'

  // Fill with trigger value
  await petTypeField.fill(triggerValue)
  await expect(breedField.find()).toBeVisible()

  // Fill with non-trigger value
  await petTypeField.fill(nonTriggerValue)
  await expect(breedField.find()).not.toBeVisible()
})
```

---

## How to Work with Lists

Lists define options for select, radio, and checkbox fields.

### Access List Items

```javascript
const list = component.list // ListController instance

// Get first item
const firstItem = list.getFirstItem() // { id, text, value }

// Get all items
const allItems = list.getAllItems()

// Get all labels
const labels = list.getAllTexts() // ['Option 1', 'Option 2', ...]

// Find by text
const item = list.findItemByText('Option 1')

// Get count
const itemCount = list.size()
```

### Use Lists in Tests

```javascript
test('should fill select with first list item', async ({ page }) => {
  const field = new SelectFieldController({
    title: 'Country',
    page,
    name: 'country',
    type: 'SelectField',
    list: new ListController({
      items: [
        { id: 'uk', text: 'United Kingdom', value: 'uk' },
        { id: 'us', text: 'United States', value: 'us' }
      ]
    })
  })

  // Default: selects first item
  await field.fill()
  await expect(field.find()).toHaveValue('uk')

  // Or explicitly:
  await field.fill('United States')
  await expect(field.find()).toHaveValue('us')
})
```

---

## How to Extend BaseFieldController

BaseFieldController provides common functionality for all field types. Extend it for custom behavior.

### Common Extensions

**Override find():**

```javascript
export class CustomFieldController extends BaseFieldController {
  find() {
    // Instead of default #${name}
    return this.page.locator(`[data-testid="${this.name}"]`)
  }
}
```

**Override fill():**

```javascript
export class ColorPickerController extends BaseFieldController {
  async fill(value) {
    // Custom fill logic for color picker
    const colorInput = this.find()
    await colorInput.click()
    const colorOption = this.page.locator(`[data-color="${value}"]`)
    await colorOption.click()
    return this
  }
}
```

**Override assertions():**

```javascript
export class CustomFieldController extends BaseFieldController {
  async assertions(expect) {
    // Call parent to check visibility/enabled
    await super.assertions(expect)

    // Add custom assertions
    const element = this.find()
    await expect(element).toHaveAttribute('data-custom', 'value')
  }
}
```

**Add Custom Helper Methods:**

```javascript
export class DatePickerController extends BaseFieldController {
  async fillWithDate(dateString) {
    // Helper to parse and fill date
    const [day, month, year] = dateString.split('/')
    const input = this.find()
    await input.fill(`${day}-${month}-${year}`)
    return this
  }

  async getSelectedDate() {
    const input = this.find()
    return await input.inputValue()
  }
}
```

### BaseFieldController Properties Available

```javascript
this.title // Field label
this.page // Playwright page instance
this.name // HTML name attribute
this.type // Component type
this.hint // Hint text
this.options // Field options { required, ... }
this.id // Component ID
this.schema // Schema { regex, min, max, ... }
this.list // ListController if applicable
this.conditions // Attached condition items
```

### BaseFieldController Methods to Override

```javascript
// Default: return this.page.locator(`#${this.name}`)
find()

// Default: checks visible + enabled
async assertions(expect)

// Default: element.fill(value)
async fill(value)

// Default: element.clear()
async clear()

// Default: checks conditions > 0
get nonTriggerValue
```

---

## Additional Resources

- [Playwright Test Documentation](https://playwright.dev/docs/intro)
- [Architecture Overview](architecture-overview.md)
- [Components & Controllers](components-and-controllers.md)
- [Conditions System](conditions.md)
- [Test Runner Flow](test-runner-flow.md)
