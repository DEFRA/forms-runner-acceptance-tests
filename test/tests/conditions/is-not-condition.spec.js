import { test, expect } from '@playwright/test'

import { IsNotCondition } from '../../conditions/is-not-condition.js'
import { addDays, toDateParts } from '../../conditions/relative-date-utils.js'
import { ABSOLUTE_DATE_VALUE, makeListController } from './fixtures.js'

test.describe('IsNotCondition', () => {
  test('NumberValue: trigger/non-trigger values are correct', () => {
    const condition = new IsNotCondition({
      id: 'cond-1',
      name: 'number-is-not',
      operator: 'is not',
      componentId: 'comp-1',
      type: 'NumberValue',
      value: 10
    })

    expect(condition.triggerValue).toBe(11)
    expect(condition.nonTriggerValue).toBe(10)
  })

  test('BooleanValue: trigger/non-trigger values are correct', () => {
    const condition = new IsNotCondition({
      id: 'cond-2',
      name: 'boolean-is-not',
      operator: 'is not',
      componentId: 'comp-2',
      type: 'BooleanValue',
      value: true
    })

    expect(condition.triggerValue).toBe(false)
    expect(condition.nonTriggerValue).toBe(true)
  })

  test('DateValue: returns [day, month, year] tuples', () => {
    const date = new Date(ABSOLUTE_DATE_VALUE)

    const condition = new IsNotCondition({
      id: 'cond-3',
      name: 'date-is-not',
      operator: 'is not',
      componentId: 'comp-3',
      type: 'DateValue',
      value: ABSOLUTE_DATE_VALUE
    })

    expect(condition.nonTriggerValue).toEqual(toDateParts(date))
    expect(condition.triggerValue).toEqual(toDateParts(addDays(date, 1)))
  })

  test('ListItemRef: maps trigger/non-trigger items and lists', () => {
    const list = makeListController()

    const condition = new IsNotCondition({
      id: 'cond-4',
      name: 'list-is-not',
      operator: 'is not',
      componentId: 'comp-4',
      type: 'ListItemRef',
      value: { itemId: 'b' },
      list
    })

    expect(condition.listItems).toHaveLength(3)

    expect(condition.nonTriggerListItem).toEqual({
      id: 'b',
      text: 'Beta',
      value: 'Beta'
    })
    expect(condition.nonTriggerValue).toBe('Beta')

    const triggerItem = condition.triggerListItem
    expect(triggerItem).not.toBeNull()
    expect(triggerItem.id).not.toBe('b')
    expect(condition.triggerValue).not.toBe('Beta')
  })
})
