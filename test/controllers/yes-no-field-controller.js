import { BaseGroupFieldController } from './base-field-controller.js'

/**
 * Controller for YesNoField components (radio buttons with Yes/No options).
 * Extends BaseGroupFieldController which provides findFieldset() and assertions().
 */
export class YesNoFieldController extends BaseGroupFieldController {
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
    await option.scrollIntoViewIfNeeded()
    await option.setChecked(true)
    await option.waitFor({ state: 'attached' })
    return this
  }

  async selectFirstOption() {
    const firstOption = this.findAllOptions().first()
    await firstOption.scrollIntoViewIfNeeded()
    await firstOption.setChecked(true)
    return this
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
    await radio.scrollIntoViewIfNeeded()
    await radio.setChecked(true)
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
 * @import {Locator} from '@playwright/test'
 */
