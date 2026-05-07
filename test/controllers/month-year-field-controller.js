import { BaseCompositeFieldController } from './base-field-controller.js'

/**
 * Controller for MonthYearField components (month/year inputs).
 */
export class MonthYearFieldController extends BaseCompositeFieldController {
  /**
   * @returns {Locator} Month input locator.
   */
  findMonthInput() {
    return this.page.locator(`#${this.name}__month`)
  }

  /**
   * @returns {Locator} Year input locator.
   */
  findYearInput() {
    return this.page.locator(`#${this.name}__year`)
  }

  /**
   * Find the fieldset containing the month/year inputs.
   * @returns {Locator} Fieldset locator.
   */
  findFieldset() {
    return this.page.getByRole('group', { name: this.title })
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<this>} The controller instance.
   */
  async assertions(expect) {
    const fieldset = this.findFieldset()
    await expect(fieldset).toBeVisible()

    const monthInput = this.findMonthInput()
    const yearInput = this.findYearInput()

    await expect(monthInput).toBeVisible()
    await expect(monthInput).toBeEnabled()
    await expect(yearInput).toBeVisible()
    await expect(yearInput).toBeEnabled()

    return this
  }

  /**
   * Fill the month/year inputs.
   * @param {string} month Month value.
   * @param {string} year Year value.
   * @returns {Promise<this>} The controller instance.
   */
  async fill(month, year) {
    await this.findMonthInput().fill(month)
    await this.findYearInput().fill(year)
    return this
  }

  /**
   * Fill the month/year inputs from a Date object.
   * @param {Date} date Date to use.
   * @returns {Promise<this>} The controller instance.
   */
  async fillFromDate(date) {
    const month = (date.getMonth() + 1).toString()
    const year = date.getFullYear().toString()
    return this.fill(month, year)
  }
}

/**
 * @typedef {import('@playwright/test').Expect} Expect
 * @typedef {import('@playwright/test').Locator} Locator
 */
