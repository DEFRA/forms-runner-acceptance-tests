import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for EmailAddressField components.
 * Inherits find(), fill(), assertions() from BaseFieldController.
 */
export class EmailAddressFieldController extends BaseFieldController {
  /**
   * Validates email format
   * @param {string} value Email address.
   * @returns {boolean} True when the value looks like an email address.
   */
  static isValidEmail(value) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value)
  }
}
