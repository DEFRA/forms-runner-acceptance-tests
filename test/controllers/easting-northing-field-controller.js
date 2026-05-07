import { BaseCompositeFieldController } from './base-field-controller.js'

/**
 * Controller for EastingNorthingField components (dual input for grid coordinates).
 * Extends BaseCompositeFieldController which provides constructor and isRequired().
 */
export class EastingNorthingFieldController extends BaseCompositeFieldController {
  /**
   * @returns {Locator} Easting input locator.
   */
  findEastingInput() {
    return this.page.getByRole('textbox', { name: 'Easting' })
  }

  /**
   * @returns {Locator} Northing input locator.
   */
  findNorthingInput() {
    return this.page.getByRole('textbox', { name: 'Northing' })
  }

  /**
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

    const eastingInput = this.findEastingInput()
    const northingInput = this.findNorthingInput()

    await expect(eastingInput).toBeVisible()
    await expect(eastingInput).toBeEnabled()
    await expect(northingInput).toBeVisible()
    await expect(northingInput).toBeEnabled()

    return this
  }

  /**
   * Fill in the Easting and Northing inputs
   * @param {string} easting - Easting value (up to 6 digits, 0-700000)
   * @param {string} northing - Northing value (up to 7 digits, 0-1300000)
   * @returns {Promise<this>} The controller instance.
   */
  async fill(easting, northing) {
    await this.findEastingInput().fill(easting)
    await this.findNorthingInput().fill(northing)
    return this
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
