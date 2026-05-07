import { IsCondition } from './is-condition.js'
import { IsNotCondition } from './is-not-condition.js'
import { IsMoreThanCondition } from './is-more-than-condition.js'
import { IsLessThanCondition } from './is-less-than-condition.js'
import { IsAtLeastCondition } from './is-at-least-condition.js'
import { IsAtMostCondition } from './is-at-most-condition.js'

import { ConditionMapper } from '../helpers/components-mapper.js'

export {
  IsCondition,
  IsNotCondition,
  IsMoreThanCondition,
  IsLessThanCondition,
  IsAtLeastCondition,
  IsAtMostCondition
}

/**
 * @typedef {IsCondition | IsNotCondition | IsMoreThanCondition | IsLessThanCondition | IsAtLeastCondition | IsAtMostCondition} ConditionInstance
 */

/**
 * @typedef {object} ConditionItemDefinition
 * @property {string} id Item id.
 * @property {string} componentId Component id.
 * @property {string} operator Operator.
 * @property {object} value Value definition.
 * @property {'ListItemRef' | 'NumberValue'} type Value type.
 */

/**
 * @typedef {object} ConditionDefinition
 * @property {string} id Condition id.
 * @property {string} displayName Display name.
 * @property {ConditionItemDefinition[]} items Condition items.
 */

/**
 * @typedef {object} ListDefinition
 * @property {string} id List id.
 * @property {string} name List name.
 * @property {string} title List title.
 * @property {string} type List type.
 * @property {Array<{id: string, text: string, value: string}>} items List items.
 */

/**
 * @typedef {object} FormDefinition
 * @property {Array<{components: Array<{id: string, list?: string}>}>} pages Form pages.
 * @property {ConditionDefinition[]} conditions Form conditions.
 * @property {ListDefinition[]} lists Form lists.
 */

/**
 * Create a condition instance from a condition definition
 * @param {ConditionDefinition} conditionDef - The condition definition from JSON
 * @param {FormDefinition} formDefinition - The full form definition (for list lookups)
 * @param {Page} page - Playwright page object
 * @returns {object | null} - Condition instance or null if operator not supported
 */
export function createCondition(conditionDef, formDefinition, page) {
  return ConditionMapper.createCondition(conditionDef, formDefinition, page)
}

/**
 * Create all condition instances for a form
 * @param {FormDefinition} formDefinition - The form definition
 * @param {Page} page - Playwright page object
 * @returns {Map<string, object>} - Map of condition ID to condition instance
 */
export function createConditionsForForm(formDefinition, page) {
  return ConditionMapper.createConditionsForForm(formDefinition, page)
}

/**
 * Get the condition that controls a specific page
 * @param {object} pageDef - The page definition
 * @param {Map<string, object>} conditionsMap - Map of condition instances
 * @returns {object | undefined} - The condition instance or undefined
 */
export function getConditionForPage(pageDef, conditionsMap) {
  return ConditionMapper.getConditionForPage(pageDef, conditionsMap)
}

/**
 * Get list of supported operators
 * @returns {string[]} Supported operators.
 */
export function getSupportedOperators() {
  return ConditionMapper.getSupportedOperators()
}

/**
 * @import {Page} from '@playwright/test'
 */
