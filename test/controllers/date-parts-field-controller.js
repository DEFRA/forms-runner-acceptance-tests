import { BaseCompositeFieldController } from './base-field-controller.js'

/**
 * Controller for DatePartsField components (day/month/year inputs).
 * Extends BaseCompositeFieldController which provides constructor and isRequired().
 */
export class DatePartsFieldController extends BaseCompositeFieldController {
  /**
   * @returns {Locator} Day input locator.
   */
  findDayInput() {
    return this.page.locator(`#${this.name}__day`)
  }

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
   * Find the fieldset containing the date parts
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

    const dayInput = this.findDayInput()
    const monthInput = this.findMonthInput()
    const yearInput = this.findYearInput()

    await expect(dayInput).toBeVisible()
    await expect(dayInput).toBeEnabled()
    await expect(monthInput).toBeVisible()
    await expect(monthInput).toBeEnabled()
    await expect(yearInput).toBeVisible()
    await expect(yearInput).toBeEnabled()

    return this
  }

  /**
   * Fill the day/month/year inputs.
   * @param {string} day Day value.
   * @param {string} month Month value.
   * @param {string} year Year value.
   * @returns {Promise<this>} The controller instance.
   */
  async fill(day, month, year) {
    await this.findDayInput().fill(day)
    await this.findMonthInput().fill(month)
    await this.findYearInput().fill(year)
    return this
  }

  /**
   * Fill the date inputs from a Date object.
   * @param {Date} date Date to use.
   * @returns {Promise<this>} The controller instance.
   */
  async fillFromDate(date) {
    const day = date.getDate().toString()
    const month = (date.getMonth() + 1).toString()
    const year = date.getFullYear().toString()
    return this.fill(day, month, year)
  }
}

/**
 * @typedef {import('@playwright/test').Expect} Expect
 * @typedef {import('@playwright/test').Locator} Locator
 */
