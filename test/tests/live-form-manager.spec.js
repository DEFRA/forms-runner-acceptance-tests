import { test, expect } from '@playwright/test'

import { config } from '../config.js'
import { initializeComponentsForPage } from '../helpers/PageInitializer.js'
import {
  extractPathFromUrl,
  findPageByPath,
  isRepeatPageInstance,
  isRepeatSummaryPath,
  summarySubmitButtonText
} from '../helpers/common.js'
import {
  getDraftFormDefinitionIds,
  getLiveFormDefinitionIds,
  getTestFormDefinitionIds,
  loadDraftFormDefinition,
  loadLiveFormDefinition,
  loadTestFormDefinition
} from '../helpers/live-form-manager.js'

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
  FileUploadField: []
}

const summaryControllers = new Set([
  'SummaryPageWithConfirmationEmailController',
  'SummaryPageController'
])

const liveFormDefinitionIds = getLiveFormDefinitionIds()
const draftFormDefinitionIds = getDraftFormDefinitionIds()
const testFormDefinitionIds = getTestFormDefinitionIds()

/**
 * Determine whether any managed form ids have been configured.
 * @returns {boolean} True when at least one form id is configured.
 */
function hasManagedFormsConfigured() {
  return (
    liveFormDefinitionIds.length > 0 ||
    draftFormDefinitionIds.length > 0 ||
    testFormDefinitionIds.length > 0
  )
}

/**
 * Resolve the summary page heading text for a form page.
 * @param {object} pageDef Form page definition.
 * @returns {string} Summary page heading.
 */
function getSummaryHeadingText(pageDef) {
  return pageDef.title?.length > 0
    ? pageDef.title
    : 'Check your answers before sending your form'
}

/**
 * Determine whether a page definition is a summary page.
 * @param {object} pageDef Form page definition.
 * @returns {boolean} True when the page is a summary page.
 */
function isSummaryPage(pageDef) {
  return summaryControllers.has(pageDef.controller)
}

/**
 * Continue from the current page and push the next URL onto the navigation stack when it changes.
 * @param {Page} page Playwright page.
 * @param {string} slug Form slug.
 * @param {boolean} previewMode Whether the form is in draft preview mode.
 * @param {string} currentPath Current form path.
 * @param {string[]} navigationStack Stack of URLs to visit.
 * @returns {Promise<void>}
 */
async function continueAndTrack(
  page,
  slug,
  previewMode,
  currentPath,
  navigationStack
) {
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForLoadState('networkidle')

  pushTrackedUrl(page.url(), slug, previewMode, currentPath, navigationStack)
}

/**
 * Handle repeat-page summary flows and advance when needed.
 * @param {Page} page Playwright page.
 * @param {object} definition Form definition.
 * @param {string} currentPath Current form path.
 * @param {string} slug Form slug.
 * @param {boolean} previewMode Whether the form is in draft preview mode.
 * @param {string[]} navigationStack Stack of URLs to visit.
 * @returns {Promise<boolean>} True when navigation was handled.
 */
async function handleRepeatSummaryIfNeeded(
  page,
  definition,
  currentPath,
  slug,
  previewMode,
  navigationStack
) {
  if (isRepeatSummaryPath(definition, currentPath)) {
    const addAnotherButton = page.getByRole('button', {
      name: /add another/i
    })

    if ((await addAnotherButton.count()) > 0) {
      await continueAndTrack(
        page,
        slug,
        previewMode,
        currentPath,
        navigationStack
      )
      return true
    }
  }

  const isRepeatSummaryPage =
    (await page.getByRole('button', { name: /add another/i }).count()) > 0

  if (isRepeatSummaryPage && !isRepeatPageInstance(currentPath)) {
    await continueAndTrack(
      page,
      slug,
      previewMode,
      currentPath,
      navigationStack
    )
    return true
  }

  return false
}

/**
 * Fill all initialized components on a page using default test data.
 * @param {Array<object>} initializedComponents Component controllers.
 * @returns {Promise<void>}
 */
async function fillComponents(initializedComponents) {
  for (const component of initializedComponents) {
    if (component.type === 'FileUploadField') {
      await component.uploadFile()
      await component.clickUploadButton()
      continue
    }

    if (component.type === 'RadiosField') {
      await component.selectFirstOption()
      continue
    }

    if (component.type === 'YesNoField') {
      await component.selectOption(...componentData[component.type])
      continue
    }

    if ('fill' in component && typeof component.fill === 'function') {
      const args = componentData[component.type] ?? []
      await component.fill(...args)
    }
  }
}

/**
 * Continue to the next page and assert that no validation errors were shown.
 * @param {Page} page Playwright page.
 * @returns {Promise<void>}
 */
async function continueWithoutErrors(page) {
  const urlBeforeContinue = page.url()
  await page
    .getByRole('button', { name: 'Continue' })
    .click({ noWaitAfter: true })
  await page.waitForURL((url) => url.toString() !== urlBeforeContinue, {
    timeout: 15000
  })

  const errorSummary = page.locator('.govuk-error-summary')
  await expect(errorSummary.getByText('There is a problem')).toHaveCount(0)
  expect(await errorSummary.count()).toBe(0)
}

/**
 * Click the summary submission button.
 * @param {Page} page Playwright page.
 * @param {object} pageDef Summary page definition.
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

/**
 * Wait for a successful summary submission to either change the URL or render the confirmation page.
 * @param {Page} page Playwright page.
 * @param {string} urlBeforeSubmit URL before clicking submit.
 * @returns {Promise<{ newUrl: string, confirmationVisible: boolean }>} Submission result details.
 */
async function waitForSummarySubmission(page, urlBeforeSubmit) {
  const confirmationHeading = page.getByRole('heading', {
    name: 'Form submitted'
  })

  try {
    await Promise.any([
      page
        .waitForURL((url) => url.toString() !== urlBeforeSubmit, {
          timeout: 15000
        })
        .then(() => 'url-changed'),
      confirmationHeading.waitFor({ state: 'visible', timeout: 15000 })
    ])
  } catch {
    return { newUrl: page.url(), confirmationVisible: false }
  }

  const confirmationVisible = await confirmationHeading
    .isVisible()
    .catch(() => false)

  if (confirmationVisible) {
    await expect(
      page.getByRole('heading', { name: 'What happens next' })
    ).toBeVisible()
  }

  return { newUrl: page.url(), confirmationVisible }
}

/**
 * Build the runner URL for a form start page.
 * @param {string} baseURL Runner base URL.
 * @param {string} slug Form slug.
 * @param {string} startPage Start page path.
 * @param {boolean} previewMode Whether the form is in draft preview mode.
 * @returns {string} Full runner URL.
 */
function buildFormUrl(baseURL, slug, startPage, previewMode) {
  const formPrefix = previewMode ? '/form/preview/draft' : '/form'

  return `${baseURL}${formPrefix}/${slug}${startPage}`
}

/**
 * Push a new URL onto the navigation stack when the path changes.
 * @param {string} url Candidate URL.
 * @param {string} slug Form slug.
 * @param {boolean} previewMode Whether the form is in draft preview mode.
 * @param {string} currentPath Current form path.
 * @param {string[]} navigationStack Stack of URLs to visit.
 * @returns {void}
 */
function pushTrackedUrl(url, slug, previewMode, currentPath, navigationStack) {
  const newPath = extractPathFromUrl(url, slug, previewMode)

  if (newPath !== currentPath) {
    navigationStack.push(url)
  }
}

/**
 * Handle a summary page either by stopping there or submitting the form.
 * @param {object} options Summary handling options.
 * @param {Page} options.page Playwright page.
 * @param {object} options.pageDef Summary page definition.
 * @param {string} options.slug Form slug.
 * @param {boolean} options.previewMode Whether the form is in draft preview mode.
 * @param {string} options.currentPath Current form path.
 * @param {string[]} options.navigationStack Stack of URLs to visit.
 * @param {string} options.formName Human-readable form name.
 * @param {string} options.executionLabel Test label.
 * @param {boolean} options.submitOnSummary Whether the form should be submitted.
 * @returns {Promise<boolean>} True when the test should stop on the summary page.
 */
async function handleSummaryPage({
  page,
  pageDef,
  slug,
  previewMode,
  currentPath,
  navigationStack,
  formName,
  executionLabel,
  submitOnSummary
}) {
  await expect(
    page.getByRole('heading', {
      name: getSummaryHeadingText(pageDef)
    })
  ).toBeVisible()

  if (!submitOnSummary) {
    test.info().annotations.push({
      type: 'info',
      description: `Reached summary page for ${executionLabel} form ${formName} without submitting`
    })
    return true
  }

  const urlBeforeSubmit = page.url()
  await clickSummarySubmitButton(page, pageDef)
  const { newUrl, confirmationVisible } = await waitForSummarySubmission(
    page,
    urlBeforeSubmit
  )

  if (newUrl === urlBeforeSubmit && !confirmationVisible) {
    throw new Error(
      `Submitting summary page ${pageDef.path} for ${executionLabel} form ${formName} did not navigate away from the page`
    )
  }

  if (newUrl === urlBeforeSubmit && confirmationVisible) {
    test.info().annotations.push({
      type: 'info',
      description: `Submission for ${executionLabel} form ${formName} rendered the confirmation page without changing the URL`
    })
  }

  pushTrackedUrl(newUrl, slug, previewMode, currentPath, navigationStack)

  return false
}

/**
 * Handle a single managed-form page.
 * @param {object} options Page handling options.
 * @param {Page} options.page Playwright page.
 * @param {object} options.definition Form definition.
 * @param {object} options.pageDef Current page definition.
 * @param {string} options.currentPath Current form path.
 * @param {string} options.slug Form slug.
 * @param {boolean} options.previewMode Whether the form is in draft preview mode.
 * @param {string[]} options.navigationStack Stack of URLs to visit.
 * @param {string} options.formName Human-readable form name.
 * @param {string} options.executionLabel Test label.
 * @param {boolean} options.submitOnSummary Whether to submit on the summary page.
 * @returns {Promise<'stop' | 'continue'>} Whether the flow should stop or continue.
 */
async function handleManagedPage({
  page,
  definition,
  pageDef,
  currentPath,
  slug,
  previewMode,
  navigationStack,
  formName,
  executionLabel,
  submitOnSummary
}) {
  if (pageDef.controller === 'TerminalPageController') {
    test.info().annotations.push({
      type: 'info',
      description: `Reached terminal page: ${pageDef.title || pageDef.path}`
    })
    return 'stop'
  }

  if (isSummaryPage(pageDef)) {
    const shouldStop = await handleSummaryPage({
      page,
      pageDef,
      slug,
      previewMode,
      currentPath,
      navigationStack,
      formName,
      executionLabel,
      submitOnSummary
    })

    return shouldStop ? 'stop' : 'continue'
  }

  if (
    await handleRepeatSummaryIfNeeded(
      page,
      definition,
      currentPath,
      slug,
      previewMode,
      navigationStack
    )
  ) {
    return 'continue'
  }

  const initializedComponents = await initializeComponentsForPage(
    pageDef,
    page,
    {
      lists: definition.lists,
      conditions: definition.conditions
    }
  )

  await fillComponents(initializedComponents)
  await continueWithoutErrors(page)
  pushTrackedUrl(page.url(), slug, previewMode, currentPath, navigationStack)

  return 'continue'
}

/**
 * Fill a managed form until the summary or terminal page is reached.
 * @param {object} options Flow options.
 * @param {Page} options.page Playwright page.
 * @param {string} options.baseURL Runner base URL.
 * @param {object} options.definition Form definition.
 * @param {string} options.formId Form id under test.
 * @param {string} options.formName Human-readable form name.
 * @param {string} options.slug Form slug.
 * @param {boolean} options.previewMode Whether the form is in draft preview mode.
 * @param {string} options.executionLabel Test label.
 * @param {boolean} options.submitOnSummary Whether to submit on the summary page.
 * @returns {Promise<void>}
 */
async function runManagedFormToSummary({
  page,
  baseURL,
  definition,
  formId,
  formName,
  slug,
  previewMode,
  executionLabel,
  submitOnSummary
}) {
  const startPage = definition.pages[0]?.path

  if (!startPage) {
    throw new Error(`Form ${formName} (${formId}) has no start page path`)
  }

  const formUrl = buildFormUrl(baseURL, slug, startPage, previewMode)
  const navigationStack = [formUrl]
  const visitedPaths = new Set()

  await page.goto(formUrl)
  await page.waitForLoadState('networkidle')

  const startPageTitle = definition.pages[0]?.title
  if (startPageTitle) {
    await expect(
      page.getByRole('heading', { name: startPageTitle })
    ).toBeVisible()
  }

  while (navigationStack.length > 0) {
    const currentUrl = navigationStack.pop()
    const currentPath = extractPathFromUrl(currentUrl, slug, previewMode)

    if (visitedPaths.has(currentPath)) {
      continue
    }
    visitedPaths.add(currentPath)

    const pageDef = findPageByPath(definition, currentPath)
    if (!pageDef) {
      break
    }

    if (
      (await handleManagedPage({
        page,
        definition,
        pageDef,
        currentPath,
        slug,
        previewMode,
        navigationStack,
        formName,
        executionLabel,
        submitOnSummary
      })) === 'stop'
    ) {
      break
    }
  }
}

/**
 * Register managed-form tests for a configured set of forms.
 * @param {object} options Registration options.
 * @param {string} options.executionLabel Test label shown in test names.
 * @param {string[]} options.formIds Configured form ids.
 * @param {(formId: string) => Promise<object>} options.loadFormDefinition Loader function.
 * @param {boolean} options.submitOnSummary Whether to submit the form on the summary page.
 */
function registerManagedFormTests({
  executionLabel,
  formIds,
  loadFormDefinition,
  submitOnSummary
}) {
  for (const formId of formIds) {
    const testOutcomeLabel = submitOnSummary
      ? `fills and submits ${executionLabel} form ${formId}`
      : `fills ${executionLabel} form ${formId} up to summary without submitting`

    test.describe(`${executionLabel} form ${formId} fill tests`, () => {
      test(testOutcomeLabel, async ({ page, baseURL }) => {
        test.setTimeout(config.TIMEOUT)

        const { definition, formName, slug, previewMode, hasPaymentField } =
          await loadFormDefinition(formId)

        test.skip(
          !previewMode && hasPaymentField,
          `Skipping ${executionLabel} form ${formName} (${formId}) because payment forms are not exercised in live mode`
        )

        await runManagedFormToSummary({
          page,
          baseURL,
          definition,
          formId,
          formName,
          slug,
          previewMode,
          executionLabel,
          submitOnSummary
        })
      })
    })
  }
}

if (hasManagedFormsConfigured()) {
  registerManagedFormTests({
    executionLabel: 'live',
    formIds: liveFormDefinitionIds,
    loadFormDefinition: loadLiveFormDefinition,
    submitOnSummary: false
  })
  registerManagedFormTests({
    executionLabel: 'draft',
    formIds: draftFormDefinitionIds,
    loadFormDefinition: loadDraftFormDefinition,
    submitOnSummary: true
  })
  registerManagedFormTests({
    executionLabel: 'test',
    formIds: testFormDefinitionIds,
    loadFormDefinition: loadTestFormDefinition,
    submitOnSummary: true
  })
} else {
  test.describe('forms-manager configured forms', () => {
    test.skip('No LIVE_FORM_DEFINITION_IDS, DRAFT_FORM_DEFINITION_IDS or TEST_FORM_DEFINITION_IDS configured', async () => {})
  })
}

/**
 * @typedef {import('@playwright/test').Page} Page
 */
