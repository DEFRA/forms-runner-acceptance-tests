/**
 * @typedef {object} RelativeDateValue
 * @property {number} period Amount of time.
 * @property {"days" | "months" | "years" | string} unit Time unit.
 * @property {"in the past" | "in the future" | string} direction Which side of now.
 */

/**
 * @param {unknown} value Unknown value.
 * @returns {value is RelativeDateValue} True when value matches RelativeDateValue shape.
 */
export function isRelativeDateValue(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.period === 'number' &&
    typeof value.unit === 'string' &&
    typeof value.direction === 'string'
  )
}
/**
 *
 * @param {'in the past' | 'in the future'} direction Relative direction.
 * @returns {number | never} Multiplier for date calculation.
 */
function getDirectionMultiplier(direction) {
  switch (direction) {
    case 'in the past':
      return -1
    case 'in the future':
      return 1
    default:
      throw new Error(`Unknown direction: ${direction}`)
  }
}

/**
 * @param {RelativeDateValue} relative Relative date configuration.
 * @returns {Date} Trigger date.
 */
export function getTriggerDate(relative) {
  const date = new Date()
  const directionMultiplier = getDirectionMultiplier(relative.direction)
  if (relative.unit === 'months') {
    date.setMonth(date.getMonth() + directionMultiplier * relative.period)
    return date
  }

  if (relative.unit === 'years') {
    date.setFullYear(date.getFullYear() + directionMultiplier * relative.period)
    return date
  }

  // Default to days
  date.setDate(date.getDate() + directionMultiplier * relative.period)
  return date
}
/**
 * @param {RelativeDateValue} relative Relative date configuration.
 * @returns {Date} Non-trigger date.
 */
export function getNonTriggerDate(relative) {
  const triggerDate = getTriggerDate(relative) // trigger date
  const directionMultiplier = getDirectionMultiplier(relative.direction)
  if (relative.unit === 'months') {
    triggerDate.setMonth(triggerDate.getMonth() - directionMultiplier * 1)
    return triggerDate
  }
  if (relative.unit === 'years') {
    triggerDate.setFullYear(triggerDate.getFullYear() - directionMultiplier * 1)
    return triggerDate
  }
  // Default to days
  triggerDate.setDate(triggerDate.getDate() - directionMultiplier * 1)
  return triggerDate
}

/**
 * @param {Date} date Base date.
 * @param {number} days Day delta.
 * @returns {Date} New date.
 */
export function addDays(date, days) {
  const out = new Date(date.getTime())
  out.setDate(out.getDate() + days)
  return out
}

/**
 * Convert a Date into DatePartsField-friendly values.
 * @param {Date} date Date instance.
 * @returns {[number, number, number] | null} [day, month, year] or null if invalid.
 */
export function toDateParts(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null
  }

  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
}
