import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for SelectField (dropdown) components.
 * Overrides find() to use combobox role.
 */
export class SelectFieldController extends BaseFieldController {
  /**
   * @returns {Locator} Select field locator.
   */
  find() {
    return this.page.getByRole('combobox', { name: this.title })
  }

  /**
   * Select an option by label text
   * @param {string} value - The label text of the option to select
   * @returns {Promise<this>} The controller instance.
   */
  async fill(value) {
    const label = value ?? this.list?.getFirstItem()?.text
    if (!label) {
      throw new Error(
        'No select option label provided and no list items available'
      )
    }
    await this.find().selectOption({ label })
    return this
  }
}

/**
 * @import {Locator} from '@playwright/test'
 */
