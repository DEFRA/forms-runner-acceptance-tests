import { test, expect } from '@playwright/test'

import { IsAtLeastCondition } from '../../conditions/is-at-least-condition.js'
import { getTriggerDate } from '../../conditions/relative-date-utils.js'
import {
  RELATIVE_FUTURE_10_DAYS,
  RELATIVE_PAST_10_DAYS,
  dateFromParts,
  stripTime
} from './fixtures.js'

test.describe('IsAtLeastCondition', () => {
  test('NumberValue: trigger/non-trigger values are correct', () => {
    const condition = new IsAtLeastCondition({
      id: 'cond-1',
      name: 'number-at-least',
      operator: 'is at least',
      componentId: 'comp-1',
      type: 'NumberValue',
      value: 10
    })

    expect(condition.triggerValue).toBe(10)
    expect(condition.nonTriggerValue).toBe(9)
  })

  test('RelativeDate (in the future): trigger is on/after boundary; non-trigger is before boundary', () => {
    const relative = RELATIVE_FUTURE_10_DAYS
    const boundary = stripTime(getTriggerDate(relative))

    const condition = new IsAtLeastCondition({
      id: 'cond-2',
      name: 'relative-at-least-future',
      operator: 'is at least',
      componentId: 'comp-2',
      type: 'RelativeDate',
      value: relative
    })

    const trigger = dateFromParts(condition.triggerValue)
    const nonTrigger = dateFromParts(condition.nonTriggerValue)

    expect(trigger.getTime()).toBeGreaterThanOrEqual(boundary.getTime())
    expect(nonTrigger.getTime()).toBeLessThan(boundary.getTime())
  })

  test('RelativeDate (in the past): trigger is on/before boundary; non-trigger is after boundary', () => {
    const relative = RELATIVE_PAST_10_DAYS
    const boundary = stripTime(getTriggerDate(relative))

    const condition = new IsAtLeastCondition({
      id: 'cond-3',
      name: 'relative-at-least-past',
      operator: 'is at least',
      componentId: 'comp-3',
      type: 'RelativeDate',
      value: relative
    })

    const trigger = dateFromParts(condition.triggerValue)
    const nonTrigger = dateFromParts(condition.nonTriggerValue)

    expect(trigger.getTime()).toBeLessThanOrEqual(boundary.getTime())
    expect(nonTrigger.getTime()).toBeGreaterThan(boundary.getTime())
  })
})
