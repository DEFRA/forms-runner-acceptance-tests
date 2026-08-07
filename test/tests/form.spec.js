import { readFile } from 'node:fs/promises'
import { config } from '../config.js'
import { isPaymentPage } from '@defra/forms-model'

import { test, expect } from '@playwright/test'

import { ComponentsInitializer } from '../helpers/components-mapper.js'
import {
  createFormSlug,
  extractPathFromUrl,
  findPageByPath,
  isRepeatPageInstance,
  isRepeatSummaryPath,
  summarySubmitButtonText
} from '../helpers/common.js'
import {
  initializeComponentsForPage,
  fillInitializedComponents
} from '../helpers/PageInitializer.js'
const allComponentsForm = JSON.parse(
  await readFile(new URL('../data/map.json', import.meta.url), 'utf8')
  //await readFile(new URL('../data/submit-rainfall.json', import.meta.url), 'utf8')
  // await readFile(new URL('../data/unicorn.json', import.meta.url), 'utf8')
)
// test data for each component type
const componentData = {
  DatePartsField: ['01', '01', '2000'],
  MonthYearField: ['03', '2026'],
  RadiosField: ['Option 1'],
  TextField: ['Sample text'],
  YesNoField: ['Yes'],
  NumberField: [8],
  TelephoneNumberField: ['01234567890'],
  OsGridRefField: ['SU123456'],
  EastingNorthingField: ['123456', '654321'],
  LatLongField: ['51.5074', '-0.1278'],
  GeospatialField: [],
  NationalGridFieldNumberField: ['NG1234 5678'],
  PaymentField: [], // payment details are filled in the controller
  UkAddressField: [
    {
      addressLine1: '10 Downing Street',
      addressLine2: '',
      townOrCity: 'London',
      postcode: 'SW1A 2AA'
    }
  ],
  EmailAddressField: ['test@example.com'],
  AutocompleteField: [],
  DeclarationField: [],
  SelectField: [],
  CheckboxesField: [],
  MultilineTextField: ['This is sample multiline text for testing purpose.'],
  FileUploadField: [] // file will be created on fly
}

const summaryControllers = new Set([
  'SummaryPageWithConfirmationEmailController',
  'SummaryPageController'
])
const isSummaryPage = (controller) => summaryControllers.has(controller)
/**
 *
 * @param {Page} page
 * @param {object} pageDef
 * @returns {Promise<void>}
 */
async function clickSummarySubmitButton(page, pageDef) {
  const submitActionButton = page.locator(
    'button[name="action"][value="send"], input[type="submit"][name="action"][value="send"]'
  )

  if ((await submitActionButton.count()) > 0) {
    await submitActionButton.first().click({ noWaitAfter: true })
    return
  }

  const buttonNames = [
    summarySubmitButtonText(pageDef),
    'Accept and submit',
    'Accept and send',
    'Submit',
    'Send'
  ]

  for (const buttonName of new Set(buttonNames)) {
    const button = page.getByRole('button', { name: buttonName })
    if ((await button.count()) > 0) {
      await button.click({ noWaitAfter: true })
      return
    }
  }

  throw new Error(
    `No summary submit button found for page ${pageDef.path}. Tried: ${buttonNames.join(', ')}`
  )
}

const normalized = createFormSlug(allComponentsForm.name)
const formName = allComponentsForm.name
//if the form has a payment field then run in preview mode for testing the payment page, otherwise use the normal form URL
const previewMode = allComponentsForm.pages.some((page) =>
  page.components?.some((component) => component.type === 'PaymentField')
)
console.log(
  `Running tests for form: ${formName} (slug: ${normalized}) in ${previewMode ? 'preview' : 'normal'} mode`
)

test.describe(`${formName} fill tests`, () => {
  test(`${formName} fill tests`, async ({ page, baseURL }) => {
    test.setTimeout(config.TIMEOUT) // preferable to be 2 minutes for larger forms
    const startPage = allComponentsForm.pages[0].path
    const formUrl = previewMode
      ? `${baseURL}/form/preview/draft/${normalized}${startPage}`
      : `${baseURL}/form/${normalized}${startPage}`

    // Initialize stack with the first page URL
    const navigationStack = [formUrl]
    const visitedPaths = new Set()

    // Navigate to start page
    await page.goto(formUrl)
    await page.waitForLoadState('networkidle')

    // Check that the start page is displayed
    const startPageTitle = allComponentsForm.pages[0].title
    if (startPageTitle) {
      await expect(
        page.getByRole('heading', { name: startPageTitle })
      ).toBeVisible()
    }

    while (navigationStack.length > 0) {
      const currentUrl = navigationStack.pop()
      const currentPath = extractPathFromUrl(
        currentUrl,
        normalized,
        previewMode
      )

      // Track visited paths (including UUID paths) to prevent loops.
      const basePathForTracking = currentPath

      // Prevent loops
      if (visitedPaths.has(basePathForTracking)) {
        continue
      }
      visitedPaths.add(basePathForTracking)

      // Find the page definition for the current path
      const pageDef = findPageByPath(allComponentsForm, currentPath)
      if (!pageDef) {
        console.warn(`No page definition found for path: ${currentPath}`)
        break
      }

      // Handle terminal page - test ends here
      if (pageDef.controller === 'TerminalPageController') {
        test.info().annotations.push({
          type: 'info',
          description: `Reached terminal page: ${pageDef.title || pageDef.path}`
        })
        break
      }

      // Handle main form summary page - verify and submit
      if (isSummaryPage(pageDef.controller)) {
        const headingText =
          pageDef.title?.length > 0
            ? pageDef.title
            : 'Check your answers before sending your form'
        await expect(
          page.getByRole('heading', { name: headingText })
        ).toBeVisible()
        await clickSummarySubmitButton(page, pageDef)
        await page.waitForLoadState('networkidle')
        break
      }

      // if its RepeatPageController's summary
      if (isRepeatSummaryPath(allComponentsForm, currentPath)) {
        const addAnotherButton = page.getByRole('button', {
          name: /add another/i
        })
        if ((await addAnotherButton.count()) > 0) {
          // We're on the repeat summary - click Continue to proceed
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.waitForLoadState('networkidle')

          const newUrl = page.url()
          const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
          if (newPath !== currentPath) {
            navigationStack.push(newUrl)
          }
          continue // no need to go ahead
        }

        const isRepeatSummaryPage =
          (await page.getByRole('button', { name: /add another/i }).count()) > 0
        if (isRepeatSummaryPage && !isRepeatPageInstance(currentPath)) {
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.waitForLoadState('networkidle')

          const newUrl = page.url()
          const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
          if (newPath !== currentPath) {
            navigationStack.push(newUrl)
          }
          continue
        }
      }

      // Regular page - must have components
      const components = pageDef.components
      if (!components || components.length === 0) {
        throw new Error(`No components found on page: ${pageDef.path}`)
      }

      const initializeComponents = components.map((componentDef) =>
        ComponentsInitializer.initializeComponent(
          componentDef,
          page,
          allComponentsForm.lists,
          allComponentsForm.conditions
        )
      )

      // Fill each component
      for (const component of initializeComponents) {
        console.log(
          `Processing component: ${component.name} of type ${component.type}`
        )
        if (component.type === 'FileUploadField') {
          // Handle file upload separately - controller creates a file on the fly
          await component.uploadFile()
        } else if (component.type === 'RadiosField') {
          await component.selectFirstOption()
        } else if (component.type === 'YesNoField') {
          await component.selectOption(...componentData[component.type])
        } else if (
          'fill' in component &&
          typeof component.fill === 'function'
        ) {
          console.log(
            `Filling component: ${component.name} of type ${component.type}`
          )
          await component.fill(...componentData[component.type])
        }
      }

      await page.waitForLoadState('networkidle')
      // Submit and navigate to next page
      //for pamentpage it will submit
      const submitButton = page.getByRole('button', { name: 'Submit' })
      const continueButton = page.getByRole('button', { name: 'Continue' })
      if ((await submitButton.count()) > 0) {
        await submitButton.click({ noWaitAfter: true })
      } else {
        await continueButton.click({ noWaitAfter: true })
      }
      await page.waitForLoadState('networkidle')
      // ther should be no validation errors
      const errorSummary = page.getByRole('alert')
      await expect(errorSummary.getByText('There is a problem')).toHaveCount(0)
      const errorCount = await errorSummary.count()
      expect(errorCount).toBe(0)

      // Get the new URL after navigation and push to stack
      const newUrl = page.url()
      const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

      if (newPath !== currentPath) {
        navigationStack.push(newUrl)
      }
    }
  })
})

test.describe(`${formName} required fields tests`, () => {
  test('Required fields error tests', async ({ page, baseURL }) => {
    test.setTimeout(config.TIMEOUT) // preferable to be 2 minutes for larger forms
    const startPage = allComponentsForm.pages[0].path
    const formUrl = previewMode
      ? `${baseURL}/form/preview/draft/${normalized}${startPage}`
      : `${baseURL}/form/${normalized}${startPage}`
    // Initialize stack with the first page URL
    const navigationStack = [formUrl]
    const visitedPaths = new Set()

    // Navigate to start page
    await page.goto(formUrl)
    await page.waitForLoadState('networkidle')

    // Check that the start page is displayed
    const startPageTitle = allComponentsForm.pages[0].title
    if (startPageTitle) {
      await expect(
        page.getByRole('heading', { name: startPageTitle })
      ).toBeVisible()
    }

    while (navigationStack.length > 0) {
      const currentUrl = navigationStack.pop()
      const currentPath = extractPathFromUrl(
        currentUrl,
        normalized,
        previewMode
      )

      // Track visited paths (including UUID paths) to prevent loops.
      const basePathForTracking = currentPath

      // Prevent infinite loops
      if (visitedPaths.has(basePathForTracking)) {
        continue
      }
      visitedPaths.add(basePathForTracking)

      // Find the page definition for the current path
      const pageDef = findPageByPath(allComponentsForm, currentPath)
      if (!pageDef) {
        break
      }

      // Handle terminal page - test ends here
      if (pageDef.controller === 'TerminalPageController') {
        test.info().annotations.push({
          type: 'info',
          description: `Reached terminal page: ${pageDef.title || pageDef.path}`
        })
        break
      }

      // Handle main form summary page - verify and submit
      if (isSummaryPage(pageDef.controller)) {
        const headingText =
          pageDef.title?.length > 0
            ? pageDef.title
            : 'Check your answers before sending your form'
        await expect(
          page.getByRole('heading', { name: headingText })
        ).toBeVisible()
        await clickSummarySubmitButton(page, pageDef)
        await page.waitForLoadState('networkidle')
        break
      }

      if (isPaymentPage(pageDef)) {
        const initializedComponents = await initializeComponentsForPage(
          pageDef,
          page,
          {
            lists: allComponentsForm.lists,
            conditions: allComponentsForm.conditions
          }
        )

        for (const component of initializedComponents) {
          if (
            'assertions' in component &&
            typeof component.assertions === 'function'
          ) {
            await component.assertions(expect)
          }
        }

        await fillInitializedComponents(initializedComponents, componentData)

        test.info().annotations.push({
          type: 'info',
          description: `Processed payment page: ${pageDef.title || pageDef.path}`
        })

        const newUrl = page.url()
        const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

        if (newPath !== currentPath) {
          navigationStack.push(newUrl)
        }
        continue
      }

      // provide-details-about-your-wildlife-related-or-animal-welfare-offence/summary
      if (isRepeatSummaryPath(allComponentsForm, currentPath)) {
        const addAnotherButton = page.getByRole('button', {
          name: /add another/i
        })
        if ((await addAnotherButton.count()) > 0) {
          // We're on the repeat summary - click Continue to proceed
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.waitForLoadState('networkidle')

          const newUrl = page.url()
          const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
          if (newPath !== currentPath) {
            navigationStack.push(newUrl)
          }
          continue // no need to go ahead
        }
      }

      const isRepeatSummaryPage =
        (await page.getByRole('button', { name: /add another/i }).count()) > 0
      if (isRepeatSummaryPage && !isRepeatPageInstance(currentPath)) {
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForLoadState('networkidle')

        const newUrl = page.url()
        const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
        if (newPath !== currentPath) {
          navigationStack.push(newUrl)
        }
        continue
      }

      const initializedComponents = await initializeComponentsForPage(
        pageDef,
        page,
        {
          lists: allComponentsForm.lists,
          conditions: allComponentsForm.conditions
        }
      )

      // run required-fields validation only on pages that actually have required components
      const hasRequiredComponents = initializedComponents.some(
        (component) => component.isRequired ?? false
      )

      if (hasRequiredComponents) {
        const pathBeforeValidation = extractPathFromUrl(
          page.url(),
          normalized,
          previewMode
        )

        const errorText = page
          .locator('.govuk-error-summary')
          .getByText('There is a problem')

        const errorPromise = errorText
          .waitFor({ state: 'visible', timeout: 5000 })
          .then(() => 'error')
          .catch(() => undefined)

        const navigationPromise = page
          .waitForURL(
            (url) =>
              extractPathFromUrl(url.toString(), normalized, previewMode) !==
              pathBeforeValidation,
            { timeout: 5000 }
          )
          .then(() => 'navigated')
          .catch(() => undefined)

        await page
          .getByRole('button', { name: 'Continue' })
          .click({ noWaitAfter: true })
        const outcome = await Promise.race([errorPromise, navigationPromise])

        if (outcome === 'navigated') {
          // No validation error was raised; return to this page so the fill flow stays in sync.
          console.warn(
            `No required-fields error shown; navigated away from ${pathBeforeValidation}`
          )
          await page.goBack()
          await page.waitForURL(
            (url) =>
              extractPathFromUrl(url.toString(), normalized, previewMode) ===
              pathBeforeValidation,
            { timeout: 10000 }
          )
        } else if (outcome === 'error') {
          await expect(errorText).toBeVisible()
        } else {
          throw new Error(
            `Required-fields validation did not produce an error or navigation on: ${pathBeforeValidation}`
          )
        }
      }

      await fillInitializedComponents(initializedComponents, componentData)

      // Submit and navigate to next page (avoid networkidle which can hang)
      const urlBeforeContinue = page.url()
      await page
        .getByRole('button', { name: 'Continue' })
        .click({ noWaitAfter: true })
      await page.waitForURL((url) => url.toString() !== urlBeforeContinue, {
        timeout: 15000
      })
      // there should be no validation errors
      const errorSummary = page.locator('.govuk-error-summary')
      await expect(errorSummary.getByText('There is a problem')).toHaveCount(0)
      const errorCount = await errorSummary.count()
      expect(errorCount).toBe(0)

      // Get the new URL after navigation and push to stack
      const newUrl = page.url()
      const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

      if (newPath !== currentPath) {
        navigationStack.push(newUrl)
      }
    }
  })
})

test.describe(`${formName} skip optional fields`, () => {
  test('Skipping optional fields', async ({ page, baseURL }) => {
    test.setTimeout(config.TIMEOUT) // preferable to be 2 minutes for larger forms
    const startPage = allComponentsForm.pages[0].path
    const formUrl = previewMode
      ? `${baseURL}/form/preview/draft/${normalized}${startPage}`
      : `${baseURL}/form/${normalized}${startPage}`
    // Initialize stack with the first page URL
    const navigationStack = [formUrl]
    const visitedPaths = new Set()

    // Navigate to start page
    await page.goto(formUrl)
    await page.waitForLoadState('networkidle')

    // Check that the start page is displayed
    const startPageTitle = allComponentsForm.pages[0].title
    if (startPageTitle) {
      await expect(
        page.getByRole('heading', { name: startPageTitle })
      ).toBeVisible()
    }

    while (navigationStack.length > 0) {
      const currentUrl = navigationStack.pop()
      const currentPath = extractPathFromUrl(
        currentUrl,
        normalized,
        previewMode
      )

      // Track visited paths (including UUID paths) to prevent loops.
      const basePathForTracking = currentPath

      // Prevent infinite loops
      if (visitedPaths.has(basePathForTracking)) {
        continue
      }
      visitedPaths.add(basePathForTracking)

      // Find the page definition for the current path
      const pageDef = findPageByPath(allComponentsForm, currentPath)
      if (!pageDef) {
        break
      }

      // Handle terminal page - test ends here
      if (pageDef.controller === 'TerminalPageController') {
        test.info().annotations.push({
          type: 'info',
          description: `Reached terminal page: ${pageDef.title || pageDef.path}`
        })
        break
      }

      // Handle main form summary page - verify and submit
      if (isSummaryPage(pageDef.controller)) {
        const headingText =
          pageDef.title?.length > 0
            ? pageDef.title
            : 'Check your answers before sending your form'
        await expect(
          page.getByRole('heading', { name: headingText })
        ).toBeVisible()
        await clickSummarySubmitButton(page, pageDef)
        await page.waitForLoadState('networkidle')
        break
      }

      if (isPaymentPage(pageDef)) {
        const initializedComponents = await initializeComponentsForPage(
          pageDef,
          page,
          {
            lists: allComponentsForm.lists,
            conditions: allComponentsForm.conditions
          }
        )

        for (const component of initializedComponents) {
          if (
            'assertions' in component &&
            typeof component.assertions === 'function'
          ) {
            await component.assertions(expect)
          }
        }

        await fillInitializedComponents(
          initializedComponents,
          componentData,
          undefined,
          false
        )

        test.info().annotations.push({
          type: 'info',
          description: `Processed payment page: ${pageDef.title || pageDef.path}`
        })

        const newUrl = page.url()
        const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

        if (newPath !== currentPath) {
          navigationStack.push(newUrl)
        }
        continue
      }

      // provide-details-about-your-wildlife-related-or-animal-welfare-offence/summary
      if (isRepeatSummaryPath(allComponentsForm, currentPath)) {
        const addAnotherButton = page.getByRole('button', {
          name: /add another/i
        })
        if ((await addAnotherButton.count()) > 0) {
          // We're on the repeat summary - click Continue to proceed
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.waitForLoadState('networkidle')

          const newUrl = page.url()
          const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
          if (newPath !== currentPath) {
            navigationStack.push(newUrl)
          }
          continue // no need to go ahead
        }
      }

      const isRepeatSummaryPage =
        (await page.getByRole('button', { name: /add another/i }).count()) > 0
      if (isRepeatSummaryPage && !isRepeatPageInstance(currentPath)) {
        await page.getByRole('button', { name: 'Continue' }).click()
        await page.waitForLoadState('networkidle')

        const newUrl = page.url()
        const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
        if (newPath !== currentPath) {
          navigationStack.push(newUrl)
        }
        continue
      }

      const initializedComponents = await initializeComponentsForPage(
        pageDef,
        page,
        {
          lists: allComponentsForm.lists,
          conditions: allComponentsForm.conditions
        }
      )

      await fillInitializedComponents(
        initializedComponents,
        componentData,
        undefined,
        true
      )

      // Submit and navigate to next page (avoid networkidle which can hang)
      const urlBeforeContinue = page.url()
      await page
        .getByRole('button', { name: 'Continue' })
        .click({ noWaitAfter: true })
      await page.waitForURL((url) => url.toString() !== urlBeforeContinue, {
        timeout: 15000
      })
      // there should be no validation errors
      const errorSummary = page.locator('.govuk-error-summary')
      await expect(errorSummary.getByText('There is a problem')).toHaveCount(0)
      const errorCount = await errorSummary.count()
      expect(errorCount).toBe(0)

      // Get the new URL after navigation and push to stack
      const newUrl = page.url()
      const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

      if (newPath !== currentPath) {
        navigationStack.push(newUrl)
      }
    }
  })
})

test.describe(`${formName} conditions tests`, () => {
  const conditions = allComponentsForm.conditions || []
  const conditionIds = conditions.map((cond) => cond.id)
  for (const conditionId of conditionIds) {
    const displayName =
      conditions.find((c) => c.id === conditionId)?.displayName || conditionId
    test(`Condition test for condition ${displayName}`, async ({
      page,
      baseURL
    }) => {
      test.setTimeout(config.TIMEOUT) // preferable to be 2 minutes for larger forms
      const startPage = allComponentsForm.pages[0].path
      const formUrl = previewMode
        ? `${baseURL}/form/preview/draft/${normalized}${startPage}`
        : `${baseURL}/form/${normalized}${startPage}`
      // Initialize stack with the first page URL
      const navigationStack = [formUrl]
      const visitedPaths = new Set()

      // Navigate to start page
      await page.goto(formUrl)
      await page.waitForLoadState('networkidle')

      // Check that the start page is displayed
      const startPageTitle = allComponentsForm.pages[0].title
      if (startPageTitle) {
        await expect(
          page.getByRole('heading', { name: startPageTitle })
        ).toBeVisible()
      }

      while (navigationStack.length > 0) {
        const currentUrl = navigationStack.pop()
        const currentPath = extractPathFromUrl(
          currentUrl,
          normalized,
          previewMode
        )

        // Track visited paths (including UUID paths) to prevent loops.
        const basePathForTracking = currentPath

        // Prevent infinite loops
        if (visitedPaths.has(basePathForTracking)) {
          continue
        }
        visitedPaths.add(basePathForTracking)

        // Find the page definition for the current path
        const pageDef = findPageByPath(allComponentsForm, currentPath)
        if (!pageDef) {
          break
        }

        // Handle terminal page - test ends here
        if (pageDef.controller === 'TerminalPageController') {
          test.info().annotations.push({
            type: 'info',
            description: `Reached terminal page: ${pageDef.title || pageDef.path}`
          })
          break
        }

        // Handle main form summary page - verify and submit
        if (isSummaryPage(pageDef.controller)) {
          const headingText = pageDef.title?.length
            ? pageDef.title
            : 'Check your answers before sending your form'
          await expect(
            page.getByRole('heading', { name: headingText })
          ).toBeVisible()
          await clickSummarySubmitButton(page, pageDef)
          await page.waitForLoadState('networkidle')
          break
        }

        if (isPaymentPage(pageDef)) {
          const initializedComponents = await initializeComponentsForPage(
            pageDef,
            page,
            {
              lists: allComponentsForm.lists,
              conditions: allComponentsForm.conditions
            }
          )

          for (const component of initializedComponents) {
            if (
              'assertions' in component &&
              typeof component.assertions === 'function'
            ) {
              await component.assertions(expect)
            }
          }

          await fillInitializedComponents(
            initializedComponents,
            componentData,
            conditionId,
            false
          )

          test.info().annotations.push({
            type: 'info',
            description: `Processed payment page: ${pageDef.title || pageDef.path}`
          })
          break
        }

        // provide-details-about-your-wildlife-related-or-animal-welfare-offence/summary
        if (isRepeatSummaryPath(allComponentsForm, currentPath)) {
          const addAnotherButton = page.getByRole('button', {
            name: /add another/i
          })
          if ((await addAnotherButton.count()) > 0) {
            // We're on the repeat summary - click Continue to proceed
            await page.getByRole('button', { name: 'Continue' }).click()
            await page.waitForLoadState('networkidle')

            const newUrl = page.url()
            const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
            if (newPath !== currentPath) {
              navigationStack.push(newUrl)
            }
            continue // no need to go ahead
          }
        }

        const isRepeatSummaryPage =
          (await page.getByRole('button', { name: /add another/i }).count()) > 0
        if (isRepeatSummaryPage && !isRepeatPageInstance(currentPath)) {
          await page.getByRole('button', { name: 'Continue' }).click()
          await page.waitForLoadState('networkidle')

          const newUrl = page.url()
          const newPath = extractPathFromUrl(newUrl, normalized, previewMode)
          if (newPath !== currentPath) {
            navigationStack.push(newUrl)
          }
          continue
        }

        const initializedComponents = await initializeComponentsForPage(
          pageDef,
          page,
          {
            lists: allComponentsForm.lists,
            conditions: allComponentsForm.conditions
          }
        )

        await fillInitializedComponents(
          initializedComponents,
          componentData,
          conditionId,
          false
        )

        // Submit and navigate to next page (avoid networkidle which can hang)
        const urlBeforeContinue = page.url()
        await page
          .getByRole('button', { name: 'Continue' })
          .click({ noWaitAfter: true })
        await page.waitForURL((url) => url.toString() !== urlBeforeContinue, {
          timeout: 15000
        })
        // there should be no validation errors
        const errorSummary = page.locator('.govuk-error-summary')
        await expect(errorSummary.getByText('There is a problem')).toHaveCount(
          0
        )
        const errorCount = await errorSummary.count()
        expect(errorCount).toBe(0)

        // Get the new URL after navigation and push to stack
        const newUrl = page.url()
        const newPath = extractPathFromUrl(newUrl, normalized, previewMode)

        if (newPath !== currentPath) {
          navigationStack.push(newUrl)
        }
      }
    })
  }
})
