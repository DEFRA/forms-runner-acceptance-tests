import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for TelephoneNumberField components.
 * Inherits find(), fill(), assertions() from BaseFieldController.
 */
export class TelephoneNumberFieldController extends BaseFieldController {
  /**
   * Validates UK phone number format
   * @param {string} value Phone number.
   * @returns {boolean} True when the value looks like a UK phone number.
   */
  static isValidUKPhoneNumber(value) {
    // Basic UK phone number validation
    const pattern = /^(?:(?:\+44)|(?:0))(?:\d{10}|\d{9})$/
    const cleaned = value.replace(/[\s-]/g, '')
    return pattern.test(cleaned)
  }
}
