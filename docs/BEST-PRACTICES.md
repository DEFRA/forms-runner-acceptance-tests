# Best Practices

Guidelines and conventions for maintaining quality in the forms-runner-acceptance-tests.

## Test Structure & Organization

### Test Naming Conventions

- **Use descriptive, behavior-focused test names:**

  ```javascript
  // ❌ BAD
  test('test form', async () => {})
  test('fill field', async () => {})

  // ✅ GOOD
  test('should display required field error when name is not entered', async () => {})
  test('should navigate to next page when all required fields are filled', async () => {})
  ```

- **Structure: "should [expected behavior] when [condition]"**
  ```javascript
  test('should show address field when UK address type is selected', async () => {})
  test('should calculate total cost when quantity is changed', async () => {})
  ```

### Test Organization

- **Group related tests using `describe`:**

  ```javascript
  test.describe('Payment Field', () => {
    test('should accept valid card numbers', async () => {})
    test('should reject invalid card numbers', async () => {})
    test('should format entered card number', async () => {})
  })
  ```

- **Use `beforeEach` for common setup:**

  ```javascript
  test.describe('Form Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/my-form')
    })

    test('should navigate forward on click', async () => {})
    test('should navigate backward on click', async () => {})
  })
  ```

- **Keep one spec file per feature/component:**
  ```
  test/tests/
    ├── form.spec.js (main form traversal)
    ├── payment-field-controller.spec.js
    ├── conditions.spec.js
    └── file-upload-field-controller.spec.js
  ```

---

## Controller Best Practices

### Naming Conventions

- **Always suffix with "Controller":**

  ```javascript
  // ❌ BAD
  export class TextField {}
  export class DateField {}

  // ✅ GOOD
  export class TextFieldController {}
  export class DateFieldController {}
  ```

- **Use PascalCase for class names:**
  ```javascript
  // ✅ CORRECT
  export class MyCustomFieldController {}
  ```

### Implementation Guidelines

- **Always extend one of the base controller classes:**

  ```javascript
  // ✅ GOOD - reuses common functionality
  export class MyFieldController extends BaseFieldController {
    async fill(value) {
      // Custom logic
    }
  }
  ```

- **Keep selectors simple and semantic:**

  ```javascript
  // ❌ COMPLEX - brittle
  find() {
    return this.page.locator('div.wrapper > form > div:nth-child(2) > input')
  }

  // ✅ SIMPLE - semantic and resilient
  find() {
    return this.page.getByLabel(this.title)
  }
  ```

- **Use Playwright's semantic queries:**

  ```javascript
  // ✅ PREFERRED - uses accessibility tree
  getByRole('button', { name: 'Submit' })
  getByLabel('Email Address')
  getByPlaceholder('Enter email')
  getByText('Accept and continue')

  // ⚠️ FALLBACK - when semantic isn't available
  locator('[data-testid="submit-btn"]')
  ```

- **Return `this` from async helpers for consistency:**

  ```javascript
  // ❌ HARD TO READ
  await this.find().fill(value)

  // ✅ FLUENT - returns this
  async fill(value) {
    await this.find().fill(value)
    return this
  }
  ```

### Documentation

- **Always include JSDoc comments:**
  ```javascript
  /**
   * Controller for TextField components.
   * Handles text input with optional regex validation.
   */
  export class TextFieldController extends BaseFieldController {
    /**
     * Fill the field with a value.
     * If regex schema is defined, generates a matching value.
     * @param {string} value - Text to enter (or use regex generation)
     * @returns {Promise<this>} The controller instance
     */
    async fill(value) {
      // ...
    }
  }
  ```

---

## Test Data & Fixtures

### Use Realistic Test Data

- **Avoid placeholder data:**

  ```javascript
  // ❌ BAD - not realistic
  const componentData = {
    TextField: ['abc'],
    EmailAddressField: ['x']
  }

  // ✅ GOOD - realistic values
  const componentData = {
    TextField: ['John Smith'],
    EmailAddressField: ['john.smith@example.com'],
    TelephoneNumberField: ['01234 567890'],
    PostcodeField: ['SW1A 2AA']
  }
  ```

- **Use form definition files for complex scenarios:**
  ```javascript
  // Instead of hardcoding test logic:
  // ✅ Use test/data/*.json form definitions
  // This makes tests data-driven and maintainable
  ```

### Keep Test Data Separate

- **Store reusable test data in a shared helper module when it becomes useful:**

  ```javascript
  // for example: test/helpers/test-data.js
  export const validUserData = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com'
  }

  // In tests:
  import { validUserData } from '../fixtures/test-data.js'
  await userNameField.fill(validUserData.firstName)
  ```

---

## Condition Handling

### Trigger/Non-Trigger Values

- **Always implement both properties:**

  ```javascript
  // ✅ COMPLETE
  export class MyCondition {
    get triggerValue() {
      return this.value // Satisfies condition
    }

    get nonTriggerValue() {
      return 'different-value' // Does NOT satisfy
    }
  }
  ```

- **Ensure values are different types where appropriate:**

  ```javascript
  // For string conditions
  get triggerValue() { return 'uk' }
  get nonTriggerValue() { return 'us' }  // Different string

  // For numeric conditions
  get triggerValue() { return 10 }
  get nonTriggerValue() { return 5 }  // Different number
  ```

---

## Assertions & Validation

### Use Specific Assertions

- **Avoid generic assertions:**

  ```javascript
  // ❌ TOO GENERIC
  await expect(field).toBeDefined()

  // ✅ SPECIFIC
  await expect(field).toBeVisible()
  await expect(field).toBeEnabled()
  await expect(field).toHaveValue('expected')
  ```

- **Test visibility for conditional components:**

  ```javascript
  test('should show field when condition is met', async () => {
    // Setup trigger condition
    await triggerField.fill(condition.triggerValue)

    // Assert visibility
    await expect(conditionalField.find()).toBeVisible()
  })

  test('should hide field when condition is not met', async () => {
    // Setup non-trigger condition
    await triggerField.fill(condition.nonTriggerValue)

    // Assert hidden
    await expect(conditionalField.find()).not.toBeVisible()
  })
  ```

### Include Meaningful Error Messages

- **Add context to assertions:**

  ```javascript
  // ❌ Generic
  await expect(price).toBe('100')

  // ✅ Descriptive
  await expect(price).toBe(
    '100',
    'Total price should be £100 for 10 items at £10 each'
  )
  ```

---

## Error Handling

### Graceful Error Scenarios

- **Test both success and failure paths:**

  ```javascript
  test.describe('Form Validation', () => {
    test('should submit form with valid data', async () => {
      // Happy path
    })

    test('should show error with invalid data', async () => {
      // Error path
    })
  })
  ```

- **Don't ignore errors:**

  ```javascript
  // ❌ SWALLOWS ERRORS
  await page.goto(url).catch(() => {})

  // ✅ EXPLICIT
  try {
    await page.goto(url)
  } catch (error) {
    console.error('Navigation failed:', error)
    throw error // Re-throw if test should fail
  }
  ```

---

## Performance

### Avoid Common Performance Pitfalls

- **Don't use `waitForTimeout` for waiting:**

  ```javascript
  // ❌ SLOW - arbitrary 500ms wait
  await page.waitForTimeout(500)

  // ✅ FAST - waits for actual condition
  await expect(page.locator('[data-ready]')).toBeVisible()
  ```

- **Use `waitUntil: 'networkidle'` carefully:**

  ```javascript
  // ❌ SLOW - waits for ALL network to be idle
  await page.goto(url, { waitUntil: 'networkidle' })

  // ✅ FASTER - waits for page load
  await page.goto(url, { waitUntil: 'load' })
  ```

- **Reuse page where possible:**

  ```javascript
  // ❌ CREATES NEW PAGE (SLOW)
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
  })

  // ✅ USES SAME PAGE (FAST)
  test('my test', async ({ page }) => {
    // page fixture is already provided
  })
  ```

---

## Code Quality

### Keep Code DRY (Don't Repeat Yourself)

- **Extract common patterns:**

  ```javascript
  // ❌ REPEATED
  test('A', async ({ page }) => {
    await page.goto(url)
    const field = page.getByLabel('Name')
    await field.fill('John')
  })

  test('B', async ({ page }) => {
    await page.goto(url)
    const field = page.getByLabel('Name')
    await field.fill('Jane')
  })

  // ✅ DRY - use beforeEach and helpers
  test.beforeEach(async ({ page }) => {
    await page.goto(url)
  })

  async function fillNameField(page, name) {
    await page.getByLabel('Name').fill(name)
  }
  ```

### Use TypeScript/JSDoc for Type Safety

- **Document parameter types:**

  ```javascript
  /**
   * @typedef {object} ComponentConfig
   * @property {string} title - Field label
   * @property {Page} page - Playwright page
   * @property {string} name - HTML name attribute
   */

  /**
   * @param {ComponentConfig} params
   */
  constructor({ title, page, name }) {
    this.title = title
    this.page = page
    this.name = name
  }
  ```

---

## Git & Code Review

### Commit Messages

- **Use clear, descriptive commit messages:**

  ```
  ❌ BAD
  fix bug
  update tests

  ✅ GOOD
  feat: add controller for new ColorPickerField component
  test: add test cases for payment field validation
  docs: update HOWTO guide with form definition examples
  ```

### PR Guidelines

- **Include description of changes:**

  - What changed?
  - Why did it change?
  - How to test?

- **Keep PRs focused:**

  - One feature or fix per PR
  - Don't mix multiple unrelated changes

- **Review your own PR first:**
  - Check formatting and linting
  - Verify all tests pass
  - Look for opportunities to simplify

---

## Documentation

### Keep Documentation Up-to-Date

- **Document new components:**

  - Add to [How To Guides](HOWTO.md#how-to-add-a-new-component-type)
  - Include example in components list

- **Document new patterns:**

  - If you discover a useful pattern, share it
  - Add to appropriate guide document

- **Update architecture when needed:**
  - If you change how controllers work, update [Architecture Overview](architecture-overview.md)
  - If you add a condition operator, update [Conditions System](conditions.md)

### Comment Code When Necessary

- **Comment WHY, not WHAT:**

  ```javascript
  // ❌ OBVIOUS - what does it do
  // Check if field is visible
  if (await field.isVisible()) {

  // ✅ USEFUL - why
  // Check if field is visible because the form may have conditional logic
  // that hides this field based on previous answers
  if (await field.isVisible()) {
  ```

---

## Accessibility

### Write Accessible Tests

- **Use semantic queries:**

  ```javascript
  // ❌ IGNORES ACCESSIBILITY
  page.locator('#btn123')

  // ✅ RESPECTS ACCESSIBILITY TREE
  page.getByRole('button', { name: 'Submit' })
  ```

- **Test keyboard navigation:**

  ```javascript
  test('should navigate form with Tab key', async ({ page }) => {
    const firstField = page.getByLabel('First Name')
    const secondField = page.getByLabel('Last Name')

    await firstField.focus()
    await page.keyboard.press('Tab')

    await expect(secondField).toBeFocused()
  })
  ```

- **Test screen reader compatibility:**
  - Use `getByRole()` to test against accessibility tree
  - Verify form labels are properly associated with inputs

---

## Useful Shortcuts & Tips

### Development Workflow

```bash
# Run specific test while developing
npx playwright test -g "Payment Field" --headed

# Debug a test
npx playwright test --debug

# Update snapshots after intentional changes
npx playwright test --update-snapshots

# View test report
npx playwright show-report

# Run tests serially (helpful for debugging)
npx playwright test --workers=1

# Check test list without running
npx playwright test --list
```

### VS Code Extensions

- **Playwright Test for VSCode** - run tests from editor
- **Prettier** - consistent code formatting
- **ESLint** - catch errors before tests run

---

## Common Pitfalls to Avoid

| Pitfall                              | Problem                           | Solution                      |
| ------------------------------------ | --------------------------------- | ----------------------------- |
| Hard-coded waits (`waitForTimeout`)  | Slow, unreliable tests            | Use Playwright auto-waiting   |
| Testing implementation, not behavior | Tests break when UI refactors     | Test user-visible behavior    |
| Not documenting controller behavior  | Other developers confused         | Add JSDoc comments            |
| Ignoring accessibility selectors     | Tests pass but app not accessible | Use semantic queries          |
| Creating test data in test files     | Hard to maintain                  | Use fixtures/form definitions |
| Not using controller pattern         | Code duplication                  | Always use controllers        |
| Forgetting non-trigger values        | Conditions not properly tested    | Always test both paths        |
| Complex selectors                    | Brittle tests fail on DOM changes | Keep selectors simple         |

---

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [How To Guides](HOWTO.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Architecture Overview](architecture-overview.md)
