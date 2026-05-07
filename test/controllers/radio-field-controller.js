import { BaseGroupFieldController } from './base-field-controller.js'

/**
 * Controller for RadioField components.
 * Extends BaseGroupFieldController which provides findFieldset() and assertions().
 */
export class RadioFieldController extends BaseGroupFieldController {
  /**
   * Find a specific radio option by its label text
   * @param {string} optionText - The text label of the radio option
   * @returns {Locator} Radio option locator.
   */
  findOption(optionText) {
    return this.findFieldset().getByRole('radio', { name: optionText })
  }

  /**
   * Find all radio options within the fieldset
   * @returns {Locator} Radio options locator.
   */
  findAllOptions() {
    return this.findFieldset().getByRole('radio')
  }

  /**
   * Select a radio option by its label text
   * @param {string} optionText - The text label of the radio option to select
   * @returns {Promise<this>} The controller instance.
   */
  async selectOption(optionText) {
    const option = this.findOption(optionText)
    await option.check()
    return this
  }

  /**
   * Select the first available option.
   * @returns {Promise<this>} The controller instance.
   */
  async selectFirstOption() {
    const firstOption = this.findAllOptions().first()
    await firstOption.check()
    return this
  }

  /**
   * Fill behaviour for radios: select an option (Playwright cannot fill radio inputs).
   * If the provided option text doesn't match any option, falls back to the first option.
   * @param {string} [optionText] Option label to select.
   * @returns {Promise<this>} The controller instance.
   */
  async fill(optionText) {
    if (optionText) {
      const option = this.findOption(optionText)
      if ((await option.count()) > 0) {
        await option.first().check()
        return this
      }
    }

    return await this.selectFirstOption()
  }

  /**
   * Select a radio option by its value
   * @param {string} value - The value of the radio option to select
   * @returns {Promise<this>} The controller instance.
   */
  async selectByValue(value) {
    const radio = this.findFieldset().locator(
      `input[type="radio"][value="${value}"]`
    )
    await radio.check()
    return this
  }

  /**
   * Get the currently selected radio option value
   * @returns {Promise<string|null>} Selected value, or null when none selected.
   */
  async getSelectedValue() {
    const checkedRadio = this.findFieldset().locator(
      'input[type="radio"]:checked'
    )
    const count = await checkedRadio.count()
    if (count === 0) {
      return null
    }
    return await checkedRadio.getAttribute('value')
  }

  /**
   * Check if a specific option is selected
   * @param {string} optionText - The text label of the radio option
   * @returns {Promise<boolean>} True when the option is selected.
   */
  async isOptionSelected(optionText) {
    const option = this.findOption(optionText)
    return await option.isChecked()
  }

  /**
   * Get the count of radio options
   * @returns {Promise<number>} Number of options.
   */
  async getOptionsCount() {
    return await this.findAllOptions().count()
  }
}

/**
 * @typedef {import('@playwright/test').Locator} Locator
 */
