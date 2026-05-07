import { test, expect } from '@playwright/test'

import { IsMoreThanCondition } from '../../conditions/is-more-than-condition.js'
import {
  addDays,
  getTriggerDate,
  toDateParts
} from '../../conditions/relative-date-utils.js'
import {
  ABSOLUTE_DATE_VALUE,
  RELATIVE_FUTURE_10_DAYS,
  RELATIVE_PAST_10_DAYS,
  dateFromParts,
  stripTime
} from './fixtures.js'

test.describe('IsMoreThanCondition', () => {
  test('NumberValue: trigger/non-trigger/boundary values are correct', () => {
    const condition = new IsMoreThanCondition({
      id: 'cond-1',
      name: 'number-more-than',
      operator: 'is more than',
      componentId: 'comp-1',
      type: 'NumberValue',
      value: 10
    })

    expect(condition.triggerValue).toBe(11)
    expect(condition.nonTriggerValue).toBe(10)
    expect(condition.boundaryValue).toBe(10)
  })

  test('DateValue: trigger/non-trigger/boundary tuples are correct', () => {
    const threshold = new Date(ABSOLUTE_DATE_VALUE)

    const condition = new IsMoreThanCondition({
      id: 'cond-2',
      name: 'date-more-than',
      operator: 'is more than',
      componentId: 'comp-2',
      type: 'DateValue',
      value: ABSOLUTE_DATE_VALUE
    })

    expect(condition.boundaryValue).toEqual(toDateParts(threshold))
    expect(condition.nonTriggerValue).toEqual(toDateParts(threshold))
    expect(condition.triggerValue).toEqual(toDateParts(addDays(threshold, 1)))
  })

  test('RelativeDate (in the future): trigger is after boundary; non-trigger is on/before boundary', () => {
    const relative = RELATIVE_FUTURE_10_DAYS
    const boundary = stripTime(getTriggerDate(relative))

    const condition = new IsMoreThanCondition({
      id: 'cond-3',
      name: 'relative-more-than-future',
      operator: 'is more than',
      componentId: 'comp-3',
      type: 'RelativeDate',
      value: relative
    })

    const trigger = dateFromParts(condition.triggerValue)
    const nonTrigger = dateFromParts(condition.nonTriggerValue)

    expect(trigger.getTime()).toBeGreaterThan(boundary.getTime())
    expect(nonTrigger.getTime()).toBeLessThanOrEqual(boundary.getTime())
    expect(dateFromParts(condition.boundaryValue).getTime()).toBe(
      boundary.getTime()
    )
  })

  test('RelativeDate (in the past): trigger is before boundary; non-trigger is on/after boundary', () => {
    const relative = RELATIVE_PAST_10_DAYS
    const boundary = stripTime(getTriggerDate(relative))

    const condition = new IsMoreThanCondition({
      id: 'cond-4',
      name: 'relative-more-than-past',
      operator: 'is more than',
      componentId: 'comp-4',
      type: 'RelativeDate',
      value: relative
    })

    const trigger = dateFromParts(condition.triggerValue)
    const nonTrigger = dateFromParts(condition.nonTriggerValue)

    expect(trigger.getTime()).toBeLessThan(boundary.getTime())
    expect(nonTrigger.getTime()).toBeGreaterThanOrEqual(boundary.getTime())
    expect(dateFromParts(condition.boundaryValue).getTime()).toBe(
      boundary.getTime()
    )
  })
})
