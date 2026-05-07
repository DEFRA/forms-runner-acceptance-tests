import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for DeclarationField components (checkbox with declaration text).
 * Uses BaseFieldController but overrides methods for checkbox-specific behavior.
 */
export class DeclarationFieldController extends BaseFieldController {
  /**
   * @returns {Locator} Checkbox locator.
   */
  findCheckbox() {
    return this.page.getByLabel('I understand and agree')
  }

  /**
   * @returns {Locator} Declaration content locator.
   */
  findDeclarationContent() {
    return this.page.locator(`[data-declaration-id="${this.id}"]`)
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<this>} The controller instance.
   */
  async assertions(expect) {
    const checkbox = this.findCheckbox()
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toBeEnabled()
    return this
  }

  async fill() {
    const checkbox = this.findCheckbox()
    await checkbox.check({ force: true, timeout: 5000 })
    return this
  }

  async decline() {
    const checkbox = this.findCheckbox()
    await checkbox.uncheck()
    return this
  }

  /**
   * Check if the declaration is accepted
   * @returns {Promise<boolean>} True when checked.
   */
  async isAccepted() {
    return this.findCheckbox().isChecked()
  }

  /**
   * Toggle the declaration checkbox
   * @returns {Promise<this>} this
   */
  async toggle() {
    await this.findCheckbox().click()
    return this
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
