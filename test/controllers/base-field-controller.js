/**
 * @typedef {object} BaseFieldControllerParams
 * @property {string} title - The field title/label
 * @property {Page} page - Playwright page object
 * @property {string} name - The field name attribute
 * @property {string} type - The component type
 * @property {string} [hint] - Optional hint text
 * @property {object} [options] - Field options
 * @property {boolean} [options.required] - Whether the field is required
 * @property {string} [id] - The component ID
 * @property {string} [shortDescription] - Short description of the field
 * @property {object} [schema] - Schema configuration
 * @property {ListController} [list] - Associated list ID for select-type fields
 */

/**
 * Base controller class for form field components.
 * Provides common functionality shared across all field controllers.
 */
export class BaseFieldController {
  /**
   * @param {BaseFieldControllerParams} params Controller params.
   */
  constructor({
    title,
    page,
    name,
    type,
    hint,
    options,
    id,
    shortDescription,
    schema,
    list
  }) {
    this.title = title
    this.page = page
    this.name = name
    this.type = type
    this.hint = hint
    this.options = options
    this.id = id
    this.shortDescription = shortDescription
    this.schema = schema
    this.list = list
    /**
     * @type {ConditionInstance[]}
     */
    this.conditions = []
  }

  /**
   * Gets non-trigger value when this has conditions.
   * @returns {boolean | string | [number, number, number] | null} Non-trigger value.
   */
  get nonTriggerValue() {
    if (this.conditions.length > 0) {
      return this.conditions[0].nonTriggerValue
    }
    return null
  }

  /**
   * Check if the field is required.
   * @returns {boolean} True when required.
   */
  get isRequired() {
    return this.options?.required === true
  }

  /**
   * Find the main field element.
   * Override this in subclasses for custom element location strategies.
   * @returns {Locator} Main field locator.
   */
  find() {
    return this.page.locator(`#${this.name}`)
  }

  /**
   * Run standard assertions on the field.
   * Override in subclasses for custom assertions.
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<this>} The controller instance.
   */
  async assertions(expect) {
    const element = this.find()
    await expect(element).toBeVisible()
    await expect(element).toBeEnabled()
    return this
  }

  /**
   * Fill the field with a value.
   * Override in subclasses for custom fill behavior.
   * @param {string} value Value to fill.
   * @returns {Promise<this>} The controller instance.
   */
  async fill(value) {
    await this.find().fill(value)
    return this
  }

  /**
   * Clear the field value.
   * @returns {Promise<this>} The controller instance.
   */
  async clear() {
    await this.find().clear()
    return this
  }

  /**
   * Get the current value of the field.
   * @returns {Promise<string>} Current value.
   */
  async getValue() {
    return await this.find().inputValue()
  }
}

/**
 * Base controller for group-based fields (radios, checkboxes).
 * Uses fieldset for locating the group.
 */
export class BaseGroupFieldController extends BaseFieldController {
  /**
   * Find the fieldset element containing the group.
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
    return this
  }
}

/**
 * Base controller for composite fields with multiple inputs (address, date parts).
 */
export class BaseCompositeFieldController extends BaseFieldController {
  /**
   * Find the fieldset element containing all inputs.
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
    return this
  }

  /**
   * Composite fields don't have a single find() - override to throw.
   * @returns {never} Always throws.
   */
  find() {
    throw new Error(
      `${this.type} is a composite field. Use specific find methods instead.`
    )
  }
}

/**
 * @import {Expect, Locator, Page} from '@playwright/test'
 * @import {ListController} from './list-controller.js'
 * @import {ConditionInstance} from '../conditions/index.js'
 */
