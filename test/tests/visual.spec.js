import { readFile } from 'node:fs/promises'

import { test, expect } from '@playwright/test'

import { createFormSlug } from '../helpers/common.js'

/**
 * Visual regression checks: compare the <main> content of each target page
 * against a committed baseline screenshot.
 *
 * The form comes from test/data and is created as a draft in forms-manager
 * by visual.setup.js, so the pages are previewed from a known definition.
 * Targets live in test/data/visual-targets.json. Each target can be
 * captured in these states:
 * - empty: the page as first loaded
 * - errors: after Continue with nothing entered
 * - filled: after typing the values in `fill` (selector -> value)
 *
 * Map canvases are masked because the OS basemap tiles are live data.
 * Map controls, markers, buttons and errors are still compared.
 */
const { form, targets } = JSON.parse(
  await readFile(
    new URL('../data/visual-targets.json', import.meta.url),
    'utf8'
  )
)
const definition = JSON.parse(
  await readFile(new URL(`../data/${form}`, import.meta.url), 'utf8')
)
const slug = createFormSlug(definition.name)

// Live content that changes between runs
const dynamicSelectors = ['.maplibregl-canvas']

/**
 * Wait for the page to settle before taking a screenshot.
 * @param {Page} page Playwright page.
 */
async function waitForStablePage(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
}

/**
 * Fill in a target's fields.
 * @param {Page} page Playwright page.
 * @param {{ fill?: Record<string, string> }} target Target from visual-targets.json.
 */
async function fillTarget(page, target) {
  for (const [selector, value] of Object.entries(target.fill ?? {})) {
    await page.locator(selector).fill(value)
    // Location fields update the map on change
    await page.locator(selector).blur()
  }
}

/**
 * The runner redirects to the first unanswered page, so answer the pages
 * before the target first.
 * @param {Page} page Playwright page.
 * @param {number} index Index of the target in `targets`.
 */
async function answerPreviousPages(page, index) {
  for (const previous of targets.slice(0, index)) {
    await page.goto(`/form/preview/draft/${slug}${previous.page}`)
    await fillTarget(page, previous)
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.govuk-error-summary')).toHaveCount(0)
  }
}

/**
 * @param {Page} page Playwright page.
 * @returns {Locator[]} Locators to mask in screenshots.
 */
function masks(page) {
  return dynamicSelectors.map((selector) => page.locator(selector))
}

for (const [index, target] of targets.entries()) {
  test.describe(`Visual: ${target.name}`, () => {
    for (const state of target.states) {
      test(state, async ({ page }) => {
        await answerPreviousPages(page, index)

        const query = target.query ? `?${target.query}` : ''
        await page.goto(`/form/preview/draft/${slug}${target.page}${query}`)
        await waitForStablePage(page)

        if (state === 'errors') {
          await page.getByRole('button', { name: 'Continue' }).click()
          await waitForStablePage(page)
          await expect(page.locator('.govuk-error-summary')).toBeVisible()
        }

        if (state === 'filled') {
          await fillTarget(page, target)
          await waitForStablePage(page)
        }

        await expect(page.locator('main')).toHaveScreenshot(
          `${target.name}-${state}.png`,
          { mask: masks(page) }
        )
      })
    }
  })
}

/**
 * @import { Locator, Page } from '@playwright/test'
 */
