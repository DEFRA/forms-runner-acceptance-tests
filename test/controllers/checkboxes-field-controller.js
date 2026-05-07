import { BaseGroupFieldController } from './base-field-controller.js'

/**
 * Controller for CheckboxesField components.
 * Extends BaseGroupFieldController which provides findFieldset() and assertions().
 */
export class CheckboxesFieldController extends BaseGroupFieldController {
  /**
   * Find a specific checkbox option by its label text
   * @param {string} optionText - The text label of the checkbox option
   * @returns {Locator} Checkbox option locator.
   */
  findOption(optionText) {
    return this.page.getByRole('checkbox', { name: optionText })
  }

  /**
   * Find all checkbox options within the fieldset
   * @returns {Locator} Checkbox options locator.
   */
  findAllOptions() {
    return this.findFieldset().getByRole('checkbox')
  }

  /**
   * Check a checkbox option by its label text
   * @param {string} optionText - The text label of the checkbox option to check
   * @returns {Promise<this>} The controller instance.
   */
  async checkOption(optionText) {
    const option = this.findOption(optionText)
    await option.check()
    return this
  }

  /**
   * Uncheck a checkbox option by its label text
   * @param {string} optionText - The text label of the checkbox option to uncheck
   * @returns {Promise<this>} The controller instance.
   */
  async uncheckOption(optionText) {
    const option = this.findOption(optionText)
    await option.uncheck()
    return this
  }

  /**
   * Check the first available checkbox option
   * @returns {Promise<this>} The controller instance.
   */
  async checkFirstOption() {
    const firstOption = this.findAllOptions().first()
    await firstOption.check()
    return this
  }

  /**
   * Check multiple checkbox options by their label texts
   * @param {string[]} optionTexts - Array of text labels of the checkbox options to check
   * @returns {Promise<this>} The controller instance.
   */
  async checkOptions(optionTexts) {
    for (const optionText of optionTexts) {
      await this.checkOption(optionText)
    }
    return this
  }

  /**
   * Fill method for compatibility with component filling logic
   * @param {string | string[]} value - Single option text or array of option texts to check
   * @returns {Promise<this>} The controller instance.
   */
  async fill(value) {
    if (Array.isArray(value)) {
      await this.checkOptions(value)
    } else if (typeof value === 'string') {
      await this.checkOption(value)
    } else if (!value) {
      // select first option if no value provided
      await this.checkFirstOption()
    }
    return this
  }

  get items() {
    return this.list ? this.list.getAllItems() : []
  }

  /**
   * Check a checkbox option by its value attribute
   * @param {string} value - The value of the checkbox option to check
   * @returns {Promise<this>} The controller instance.
   */
  async checkByValue(value) {
    const checkbox = this.page.locator(
      `input[type="checkbox"][value="${value}"]`
    )
    await checkbox.check()
    return this
  }

  /**
   * Get the values of all checked checkboxes
   * @returns {Promise<string[]>} Checked values.
   */
  async getCheckedValues() {
    const checkedBoxes = this.findFieldset().locator(
      'input[type="checkbox"]:checked'
    )
    const count = await checkedBoxes.count()
    const values = []
    for (let i = 0; i < count; i++) {
      const value = await checkedBoxes.nth(i).getAttribute('value')
      if (value) {
        values.push(value)
      }
    }
    return values
  }

  /**
   * Check if a specific option is checked
   * @param {string} optionText - The text label of the checkbox option
   * @returns {Promise<boolean>} True when checked.
   */
  async isOptionChecked(optionText) {
    const option = this.findOption(optionText)
    return await option.isChecked()
  }
}

/**
 * @import {Locator} from '@playwright/test'
 */
