import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for NationalGridFieldNumber components (single input for national grid number).
 * Inherits find(), fill(), assertions() from BaseFieldController.
 */
export class NationalGridFieldNumberController extends BaseFieldController {
  /**
   * Validates the format of a National Grid Field Number
   * @param {string} value National Grid Field Number.
   * @returns {boolean} True when the value matches the expected format.
   */
  static isValidFormat(value) {
    const pattern = /^[A-Z]{2}\d{8}$/i
    return pattern.test(value)
  }
}
