import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for MultilineTextField (textarea) components.
 * Inherits find(), fill(), assertions(), clear(), getValue() from BaseFieldController.
 */
export class MultilineTextFieldController extends BaseFieldController {
  /**
   * Type text into the textarea (simulates key presses)
   * @param {string} value - The text to type
   * @returns {Promise<this>} The controller instance.
   */
  async type(value) {
    await this.find().pressSequentially(value)
    return this
  }

  /**
   * Append text to existing content in the textarea
   * @param {string} value - The text to append
   * @returns {Promise<this>} The controller instance.
   */
  async append(value) {
    const currentValue = await this.getValue()
    await this.fill(currentValue + value)
    return this
  }
}
