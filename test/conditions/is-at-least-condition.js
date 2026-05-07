import {
  isRelativeDateValue,
  getTriggerDate,
  getNonTriggerDate,
  toDateParts
} from './relative-date-utils.js'
/**
 * @typedef {object} IsAtLeastConditionOptions
 * @property {Page} page Playwright page.
 * @property {string} id Condition id.
 * @property {string} name Condition name.
 * @property {string} operator Operator string.
 * @property {'NumberValue' | 'RelativeDate'} type Value type.
 * @property {string} componentId Component id.
 * @property {number | RelativeDateValue} value Condition value.
 */

export class IsAtLeastCondition {
  /**
   * @param {IsAtLeastConditionOptions} options Options.
   */
  constructor({ page, id, name, operator, componentId, value, type }) {
    this.page = page
    this.id = id
    this.name = name
    this.operator = operator
    this.componentId = componentId
    this.value = value
    this.type = type
  }

  /**
   * Get a value that triggers this condition (value >= threshold).
   * @returns {number | [number, number, number] | null} Trigger value.
   */
  get triggerValue() {
    switch (this.type) {
      case 'NumberValue':
        return this.value
      case 'RelativeDate':
        if (isRelativeDateValue(this.value)) {
          return toDateParts(getTriggerDate(this.value))
        }
        return null
      default:
        return null
    }
  }

  /**
   * Get a value that does NOT trigger this condition (value < threshold).
   * @returns {number | [number, number, number] | null} Non-trigger value.
   */
  get nonTriggerValue() {
    switch (this.type) {
      case 'NumberValue':
        return this.value - 1
      case 'RelativeDate':
        if (isRelativeDateValue(this.value)) {
          return toDateParts(getNonTriggerDate(this.value))
        }
        return null
      default:
        return null
    }
  }
}

/**
 * @import {Page} from '@playwright/test'
 * @import {RelativeDateValue} from './relative-date-utils.js'
 */
