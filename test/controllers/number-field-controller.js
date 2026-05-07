import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for NumberField components.
 * Inherits find(), fill(), assertions(), clear(), getValue() from BaseFieldController.
 */
export class NumberFieldController extends BaseFieldController {
  /**
   * Fill the number field with a numeric value
   * @param {number|string} value - The numeric value to enter
   * @returns {Promise<NumberFieldController>} The controller instance for chaining.
   */
  async fill(value) {
    await this.find().fill(String(value))
    return this
  }

  /**
   * Get the current value as a number
   * @returns {Promise<number>} Parsed numeric value.
   */
  async getNumericValue() {
    const value = await this.getValue()
    return parseFloat(value)
  }
}
