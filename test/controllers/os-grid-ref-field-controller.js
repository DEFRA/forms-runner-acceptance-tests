import { BaseFieldController } from './base-field-controller.js'

/**
 * Controller for OsGridRefField components (single input for OS grid reference).
 * Inherits find(), fill(), assertions() from BaseFieldController.
 */
export class OsGridRefFieldController extends BaseFieldController {
  /**
   * Validates the format of an OS Grid Reference
   * @param {string} value OS Grid Reference.
   * @returns {boolean} True when the value matches the expected format.
   */
  static isValidFormat(value) {
    const pattern = /^[A-Z]{2}\d{6}$/i
    return pattern.test(value)
  }
}
