/**
 * @typedef {object} ListItem
 * @property {string} id Item id.
 * @property {string} text Display text.
 * @property {string} value Stored value.
 */

import { addDays, toDateParts } from './relative-date-utils.js'

/**
 * @typedef {object} IsConditionOptions
 * @property {Page} [page] Playwright page.
 * @property {string} id Condition id.
 * @property {string} name Condition name.
 * @property {string} operator Operator string.
 * @property {string} componentId Component id.
 * @property {object | number | boolean | string | Date} value Condition value.
 * @property {'ListItemRef' | 'NumberValue' | 'BooleanValue' | 'DateValue'} type Value type.
 * @property {ListController} [list] The ListController instance.
 */

export class IsCondition {
  /**
   * @param {IsConditionOptions} options Options.
   */
  constructor({ page, id, name, operator, componentId, value, type, list }) {
    this.page = page
    this.id = id
    this.name = name
    this.operator = operator
    this.componentId = componentId
    this.value = value
    this.type = type
    this.list = list
  }

  /**
   * Get all items from the list.
   * @returns {ListItem[]} List items.
   */
  get listItems() {
    if (this.type === 'ListItemRef' && this.list) {
      return this.list.getAllItems()
    }
    return []
  }

  /**
   * Get the list item/value that triggers this condition.
   * @returns {ListItem | number | boolean | null} Triggering item/value.
   */
  get triggerListItem() {
    if (this.type === 'ListItemRef' && this.list) {
      return this.list.getItem(this.value.itemId) || null
    }
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value : null
    }
    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? this.value : null
    }
    return null
  }

  /**
   * Get a list item/value that does NOT trigger this condition.
   * @returns {ListItem | number | boolean | null} Non-triggering item/value.
   */
  get nonTriggerListItem() {
    if (this.type === 'ListItemRef' && this.list) {
      const items = this.list.getAllItems()
      return items.find((item) => item.id !== this.value.itemId) || null
    }
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value + 1 : null
    }
    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? !this.value : null
    }
    return null
  }

  /**
   * Get the value (text) that triggers this condition.
   * @returns {string | number | boolean | [number, number, number] | null} Trigger value.
   */
  get triggerValue() {
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value : null
    }
    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? this.value : null
    }
    if (this.type === 'DateValue') {
      const date = new Date(this.value)
      return toDateParts(date)
    }
    const item = this.triggerListItem
    return item && typeof item === 'object' ? item.text : null
  }

  /**
   * Get a value (text) that does NOT trigger this condition.
   * @returns {string | number | boolean | [number, number, number] | null} Non-trigger value.
   */
  get nonTriggerValue() {
    if (this.type === 'NumberValue') {
      return typeof this.value === 'number' ? this.value + 1 : null
    }
    if (this.type === 'BooleanValue') {
      return typeof this.value === 'boolean' ? !this.value : null
    }
    if (this.type === 'DateValue') {
      const date = new Date(this.value)
      return toDateParts(addDays(date, 1))
    }
    const item = this.nonTriggerListItem
    return item && typeof item === 'object' ? item.text : null
  }

  /**
   * Get all non-triggering list items.
   * @returns {ListItem[]} Non-trigger items.
   */
  get allNonTriggerItems() {
    if (this.type === 'ListItemRef' && this.list) {
      return this.list
        .getAllItems()
        .filter((item) => item.id !== this.value.itemId)
    }
    return []
  }
}

/**
 * @import {Page} from '@playwright/test'
 * @import {ListController} from '../controllers/list-controller.js'
 */
