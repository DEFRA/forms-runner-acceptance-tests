# Troubleshooting Guide

Common issues and their solutions when working with the forms-runner-acceptance-tests.

## Test Failures

### Tests Timeout

**Problem:** Test fails with `Timeout 30000ms exceeded`

**Solutions:**

1. **Check for missing waits:**

   ```javascript
   // BAD: Element might not exist yet
   const field = page.locator('#myField')

   // GOOD: Playwright auto-waits
   const field = page.getByLabel('My Field')
   await field.fill('value') // Auto-waits up to 30s for element
   ```

2. **Increase timeout for long operations:**

   ```javascript
   test(
     'slow operation',
     async ({ page }) => {
       await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
     },
     { timeout: 60000 }
   ) // 60 second timeout
   ```

3. **Check network/API delays:**
   - Open the HTML report: `npm run report` or `npx playwright show-report`
   - Check Network tab for slow API calls
   - Increase backend timeout or use test fixtures

### Element Not Found

**Problem:** `locator.click: Target page, context or browser has been closed`

**Solutions:**

1. **Verify the selector/locator:**

   ```javascript
   // Run in debug mode to inspect DOM
   npx playwright test --debug --headed
   ```

2. **Use more specific locators:**

   ```javascript
   // BAD: Too generic
   const button = page.locator('button')

   // GOOD: Semantic and specific
   const button = page.getByRole('button', { name: /submit/i })
   ```

3. **Check if element is in viewport:**
   ```javascript
   const field = page.getByLabel('Field Name')
   await field.scrollIntoViewIfNeeded()
   await field.click()
   ```

### Flaky Tests (Intermittent Failures)

**Problem:** Test passes sometimes but fails randomly

**Common causes:**

1. **Race conditions in form rendering:**

   ```javascript
   // BAD: Element might still be transitioning
   const field = page.locator('#field')
   await field.fill('value')

   // GOOD: Wait for stable state
   const field = page.getByLabel('Field')
   await field.click() // Auto-waits for actionable state
   ```

2. **Timing issues with dynamic content:**

   ```javascript
   // BAD: Hard-coded wait
   await page.waitForTimeout(500)

   // GOOD: Wait for condition
   await page.waitForFunction(() => {
     return document.querySelectorAll('[data-ready]').length > 0
   })
   ```

3. **Network race conditions:**

   ```javascript
   // BAD: Form might be updating via API
   const value = await field.inputValue()

   // GOOD: Wait for stable network
   await page.goto(url, { waitUntil: 'networkidle' })
   ```

**Fix flaky tests by:**

- Adding `test.describe.skip` or `test.skip` to skip unreliable tests temporarily
- Enabling retries: `retries: 2` in `playwright.config.js`
- Using `test.describe.configure({ mode: 'serial' })` to run tests sequentially instead of parallel

### Assertion Failures

**Problem:** `Expected 'actual' to equal 'expected'`

**Debug steps:**

1. **Print actual values:**

   ```javascript
   const value = await field.inputValue()
   console.log('Actual value:', value)
   expect(value).toBe('expected')
   ```

2. **Use more informative assertions:**

   ```javascript
   // BAD: Generic error
   expect(result).toBe('value')

   // GOOD: Descriptive error
   expect(result, 'User email should be sanitized').toBe('test@example.com')
   ```

3. **Check visibility state:**

   ```javascript
   const field = page.getByLabel('Conditional Field')

   // If visible:
   await expect(field).toBeVisible()

   // If hidden but should show:
   // Check parent conditions and trigger values
   ```

---

## Component/Controller Issues

### Controller Not Found

**Problem:** `Error: Unsupported component type: MyComponent`

**Solutions:**

1. **Verify the controller exists:**

   ```bash
   ls test/controllers/ | grep -i mycomponent
   # Should output: my-component-controller.js
   ```

2. **Check the mapping in components-mapper.js:**

   ```javascript
   // Verify it's exported from controllers/index.js
   import { MyComponentController } from './my-component-controller.js'

   // Verify it's in the mapper
   const componentsMapper = {
     MyComponent: MyComponentController // Key must match type exactly
   }
   ```

3. **Verify the type name in form JSON:**
   ```json
   {
     "type": "MyComponent", // Must match the mapper key
     "id": "my-id",
     "name": "myField"
   }
   ```

### Fill/Assertions Not Working

**Problem:** Controller fill() or assertions() method fails

**Diagnose:**

1. **Check the locator:**

   ```javascript
   // In your controller's find() method:
   find() {
     const locator = this.page.locator(`#${this.name}`)
     // Add logging temporarily:
     console.log('Looking for:', `#${this.name}`)
     return locator
   }
   ```

2. **Verify HTML structure matches:**

   ```javascript
   // If controller expects:
   getByRole('group', { name: this.title })

   // But HTML is:
   // <div> (missing fieldset/legend semantics)
   // Then selector won't find it
   ```

3. **Test controller in isolation:**

   ```javascript
   test('MyController.find() works', async ({ page }) => {
     await page.goto('http://localhost:3000/form')

     const controller = new MyComponentController({
       title: 'My Field',
       page,
       name: 'myField',
       type: 'MyComponent'
     })

     const locator = controller.find()
     await expect(locator).toBeVisible()
   })
   ```

---

## Conditions Issues

### Condition Not Triggering

**Problem:** Component should be visible but isn't (or vice versa)

**Debug:**

1. **Check condition mapping:**

   ```javascript
   test('condition mapping', async () => {
     const component = ComponentsInitializer.initializeComponent(
       componentDef,
       page,
       lists,
       conditions
     )

     console.log('Component conditions:', component.conditions)
     // Should contain condition items if correctly mapped
   })
   ```

2. **Verify trigger values:**

   ```javascript
   test('trigger values', async () => {
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

     const condition = new IsCondition({
       id: 'cond-1',
       name: 'Country is UK',
       operator: 'is',
       componentId: 'target-field',
       value: { itemId: 'country-uk', listId: 'country-list' },
       type: 'ListItemRef',
       list
     })

     console.log('Trigger:', condition.triggerValue) // 'United Kingdom'
     console.log('Non-trigger:', condition.nonTriggerValue) // 'United States'
   })
   ```

3. **Check condition operator support:**
   - Verify operator exists in `ConditionMapper.CONDITION_MAP`
   - Check condition class returns proper trigger/non-trigger values

### Condition Class Returns Wrong Values

**Problem:** `triggerValue` or `nonTriggerValue` returns unexpected result

**Fix in condition class:**

```javascript
export class MyCondition {
  get triggerValue() {
    // MUST return value that satisfies condition
    // If operator is "is", return the configured value
    return this.value
  }

  get nonTriggerValue() {
    // MUST return value that does NOT satisfy condition
    // Should be different from trigger value
    if (this.value === 'option-a') {
      return 'option-b'
    }
    return 'other-value'
  }
}
```

---

## Form Data Issues

### Component Test Data Missing

**Problem:** `componentData.MyComponent` is undefined

**Solution:**

In `test/tests/form.spec.js`, add entry to `componentData`:

```javascript
const componentData = {
  MyComponent: ['sample-value'], // Add this
  // or for complex types:
  MyComponent: [{ field1: 'value1', field2: 'value2' }]
}
```

### Form Definition Missing Components

**Problem:** Test navigates to page but finds no components

**Check:**

1. **Verify JSON is valid:**

   ```bash
   # Check for syntax errors
   node -e "console.log(require('./test/data/my-form.json'))"
   ```

2. **Verify pages have components:**

   ```json
   {
     "pages": [
       {
         "path": "/page1",
         "components": [] // ERROR: Should have components
       }
     ]
   }
   ```

3. **Check component types are supported:**
   ```json
   {
     "type": "UnsupportedFieldType" // ERROR: No controller for this
   }
   ```

---

## Environment & Configuration Issues

### Environment Variables Not Loaded

**Problem:** `config.FORMS_RUNNER_URL` is empty or Playwright `baseURL` is undefined

**Solutions:**

1. **Create .env file:**

   ```bash
   cp .env.sample .env
   # Edit with your local environment
   ```

2. **Check .env syntax:**

   ```bash
   # .env should have KEY=VALUE format
   FORMS_RUNNER_URL=http://localhost:3000
   FORMS_MANAGER_URL=http://localhost:3001
   ```

   The current `.env.sample` includes `FORMS_MANAGER_URL` but may not include `FORMS_RUNNER_URL`, so add it to your local `.env` if it is missing.

3. **Verify config.js reads it:**

   ```javascript
   // test/config.js should load environment
   import dotenv from 'dotenv'
   dotenv.config()

   export const config = joi.attempt(
     {
       FORMS_RUNNER_URL: process.env.FORMS_RUNNER_URL,
       FORMS_MANAGER_URL: process.env.FORMS_MANAGER_URL
     },
     configSchema
   )
   ```

### Tests Connect to Wrong Host

**Problem:** Tests are hitting production instead of localhost

**Fix:**

1. **Check playwright.config.js:**

   ```javascript
   export default defineConfig({
     use: {
       baseURL: config.FORMS_RUNNER_URL // For example http://localhost:3000
     }
   })
   ```

2. **Override in command:**

   ```bash
   FORMS_RUNNER_URL=http://localhost:3000 npx playwright test
   ```

3. **Check .env file:**
   ```bash
   # Add this if FORMS_RUNNER_URL is not already present
   FORMS_RUNNER_URL=http://localhost:3000
   ```

---

## Performance Issues

### Tests Running Slow

**Problem:** Test suite takes too long

**Optimization steps:**

1. **Run tests in parallel (default):**

   ```bash
   # Already parallel by default
   npx playwright test
   ```

2. **Run specific file only:**

   ```bash
   npx playwright test test/tests/form.spec.js
   ```

3. **Reduce trace recording:**
   In `playwright.config.js`:

   ```javascript
   use: {
     trace: 'off',  // Disable traces for normal runs
   }
   ```

4. **Skip screenshot/video collection:**

   ```javascript
   use: {
     screenshot: 'off',
     video: 'off',
   }
   ```

5. **Disable headed mode:**
   ```bash
   npx playwright test  # Headless by default (faster)
   ```

---

## Common Error Messages

| Error                                                            | Cause                                | Fix                                                        |
| ---------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| `locator.click: Target page, context or browser has been closed` | Browser closed unexpectedly          | Check for process/network errors                           |
| `Timeout 30000ms exceeded`                                       | Element/action took too long         | Increase timeout or check for hangs                        |
| `No visible locators matching locator`                           | Selector doesn't match any element   | Verify selector and HTML structure                         |
| `Element is not visible`                                         | Element exists but hidden/off-screen | Check CSS visibility, scroll into view                     |
| `Cannot read property 'fill' of null`                            | Locator returned null                | Check selector, add null checks                            |
| `associationFailed`                                              | Network/API error                    | Check backend service, network tab                         |
| `ERR_CONNECTION_REFUSED`                                         | Can't connect to host                | Check `FORMS_RUNNER_URL`, ensure the target app is running |

---

## Getting Help

1. **Check existing tests:** Look at `test/tests/` for similar test patterns
2. **Review controllers:** Check `test/controllers/` for similar component implementations
3. **Read docs:** Review [Architecture Overview](architecture-overview.md) and [Components & Controllers](components-and-controllers.md)
4. **Debug with Playwright Inspector:** `npx playwright test --debug`
5. **View test report:** `npx playwright show-report`
6. **Check traces:** `npx playwright show-trace path/to/trace.zip`
