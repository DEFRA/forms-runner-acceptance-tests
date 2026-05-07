import {
  addDays,
  getTriggerDate,
  isRelativeDateValue,
  toDateParts
} from './relative-date-utils.js'

/**
 * @typedef {object} IsLessThanConditionOptions
 * @property {Page} page Playwright page.
 * @property {string} id Condition id.
 * @property {string} name Condition name.
 * @property {string} operator Operator string.
 * @property {'NumberValue' | 'RelativeDate' | 'DateValue'} type Value type.
 * @property {string} componentId Component id.
 * @property {number | RelativeDateValue | string | Date} value Condition value.
 */

export class IsLessThanCondition {
  /**
   * @param {IsLessThanConditionOptions} options Options.
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
   * Get a value that triggers this condition (value < threshold).
   * @returns {number | [number, number, number] | null} Trigger value.
   */
  get triggerValue() {
    switch (this.type) {
      case 'NumberValue':
        return typeof this.value === 'number' ? this.value - 1 : null

      case 'DateValue': {
        const threshold = new Date(this.value)
        return toDateParts(addDays(threshold, -1))
      }

      case 'RelativeDate': {
        if (!isRelativeDateValue(this.value)) {
          return null
        }

        // Relativedate example is less than 15 months in the future -> trigger is less than 15 months in the future
        // Relativedate example is less than 15 months in the past   -> trigger is less than 15 months in the past
        const threshold = getTriggerDate(this.value)
        return this.value.direction === 'in the future'
          ? toDateParts(addDays(threshold, -1))
          : toDateParts(addDays(threshold, 1))
      }

      default:
        return null
    }
  }

  /**
   * Get a value that does NOT trigger this condition (value >= threshold).
   * @returns {number | [number, number, number] | null} Non-trigger value.
   */
  get nonTriggerValue() {
    switch (this.type) {
      case 'NumberValue':
        return typeof this.value === 'number' ? this.value : null

      case 'DateValue': {
        const threshold = new Date(this.value)
        return toDateParts(threshold)
      }

      case 'RelativeDate': {
        if (!isRelativeDateValue(this.value)) {
          return null
        }

        // Relativedate example is less than 15 months in the future -> non-trigger is 15 months in the future
        // Relativedate example is less than 15 months in the past   -> non-trigger is 16 months in the past
        const threshold = getTriggerDate(this.value)
        return this.value.direction === 'in the future'
          ? toDateParts(addDays(threshold, 1))
          : toDateParts(addDays(threshold, -1))
      }

      default:
        return null
    }
  }

  /**
   * Get the boundary value (the threshold itself).
   * @returns {number | [number, number, number] | null} Boundary value.
   */
  get boundaryValue() {
    switch (this.type) {
      case 'NumberValue':
        return typeof this.value === 'number' ? this.value : null

      case 'DateValue': {
        const threshold = new Date(this.value)
        return toDateParts(threshold)
      }

      case 'RelativeDate': {
        if (!isRelativeDateValue(this.value)) {
          return null
        }

        return toDateParts(getTriggerDate(this.value))
      }

      default:
        return null
    }
  }
}

/**
 * @import {Page} from '@playwright/test'
 * @import {RelativeDateValue} from './relative-date-utils.js'
 */
