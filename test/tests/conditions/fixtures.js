import { ListController } from '../../controllers/list-controller.js'

export const ABSOLUTE_DATE_VALUE = '1980-03-17'

export const RELATIVE_FUTURE_10_DAYS = {
  period: 10,
  unit: 'days',
  direction: 'in the future'
}

export const RELATIVE_PAST_10_DAYS = {
  period: 10,
  unit: 'days',
  direction: 'in the past'
}
/**
 *
 * @returns {ListController} instance
 */
export function makeListController() {
  return new ListController({
    id: 'list-1',
    name: 'My list',
    title: 'My list',
    type: 'string',
    items: [
      { id: 'a', text: 'Alpha', value: 'Alpha' },
      { id: 'b', text: 'Beta', value: 'Beta' },
      { id: 'c', text: 'Gamma', value: 'Gamma' }
    ]
  })
}

/**
 * Converts DatePartsField tuple into a Date at local midnight.
 * @param {[number, number, number]} parts [day, month, year]
 * @returns {Date} Date
 */
export function dateFromParts(parts) {
  const [day, month, year] = parts
  return new Date(year, month - 1, day) // month is 0-based
}

/**
 * Drops time portion from a Date (local midnight).
 * @param {Date} date Date.
 * @returns {Date} Date
 */
export function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
