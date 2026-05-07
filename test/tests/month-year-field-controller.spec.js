import { test, expect } from '@playwright/test'

import { MonthYearFieldController } from '../controllers/month-year-field-controller.js'

const monthYearMarkup = `
  <main>
    <form>
      <div>
        <fieldset role="group" aria-describedby="OsIXVr-hint">
          <legend>
            <h1>When you want your subscription to start from?</h1>
          </legend>
          <div id="OsIXVr-hint">All our subscription start from 1st day of month onwards</div>
          <div>
            <div>
              <label for="OsIXVr__month">Month</label>
              <input id="OsIXVr__month" name="OsIXVr__month" type="text" />
            </div>
            <div>
              <label for="OsIXVr__year">Year</label>
              <input id="OsIXVr__year" name="OsIXVr__year" type="text" />
            </div>
          </div>
        </fieldset>
      </div>
    </form>
  </main>
`

test.describe('MonthYearFieldController', () => {
  test('asserts the month and year inputs', async ({ page }) => {
    await page.setContent(monthYearMarkup)

    const controller = new MonthYearFieldController({
      title: 'When you want your subscription to start from?',
      page,
      name: 'OsIXVr',
      type: 'MonthYearField',
      hint: 'All our subscription start from 1st day of month onwards',
      options: {
        required: true
      }
    })

    await controller.assertions(expect)
  })

  test('fills the month and year inputs', async ({ page }) => {
    await page.setContent(monthYearMarkup)

    const controller = new MonthYearFieldController({
      title: 'When you want your subscription to start from?',
      page,
      name: 'OsIXVr',
      type: 'MonthYearField',
      options: {
        required: true
      }
    })

    await controller.fill('03', '2026')

    await expect(page.locator('#OsIXVr__month')).toHaveValue('03')
    await expect(page.locator('#OsIXVr__year')).toHaveValue('2026')
  })
})
