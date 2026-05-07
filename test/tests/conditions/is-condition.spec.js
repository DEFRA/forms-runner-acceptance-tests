import { test, expect } from '@playwright/test'

import { IsCondition } from '../../conditions/is-condition.js'
import { addDays, toDateParts } from '../../conditions/relative-date-utils.js'
import { ABSOLUTE_DATE_VALUE, makeListController } from './fixtures.js'

test.describe('IsCondition', () => {
  test('NumberValue: trigger/non-trigger values are correct', () => {
    const condition = new IsCondition({
      id: 'cond-1',
      name: 'number-is',
      operator: 'is',
      componentId: 'comp-1',
      type: 'NumberValue',
      value: 10
    })

    expect(condition.triggerValue).toBe(10)
    expect(condition.nonTriggerValue).toBe(11)
  })

  test('BooleanValue: trigger/non-trigger values are correct', () => {
    const condition = new IsCondition({
      id: 'cond-2',
      name: 'boolean-is',
      operator: 'is',
      componentId: 'comp-2',
      type: 'BooleanValue',
      value: true
    })

    expect(condition.triggerValue).toBe(true)
    expect(condition.nonTriggerValue).toBe(false)
  })

  test('DateValue: returns [day, month, year] tuples', () => {
    const value = ABSOLUTE_DATE_VALUE
    const date = new Date(ABSOLUTE_DATE_VALUE)

    const condition = new IsCondition({
      id: 'cond-3',
      name: 'date-is',
      operator: 'is',
      componentId: 'comp-3',
      type: 'DateValue',
      value
    })

    expect(condition.triggerValue).toEqual(toDateParts(date))
    expect(condition.nonTriggerValue).toEqual(toDateParts(addDays(date, 1)))
  })

  test('ListItemRef: maps trigger/non-trigger items and lists', () => {
    const list = makeListController()

    const condition = new IsCondition({
      id: 'cond-4',
      name: 'list-is',
      operator: 'is',
      componentId: 'comp-4',
      type: 'ListItemRef',
      value: { itemId: 'b' },
      list
    })

    expect(condition.listItems).toHaveLength(3)
    expect(condition.triggerListItem).toEqual({
      id: 'b',
      text: 'Beta',
      value: 'Beta'
    })
    expect(condition.triggerValue).toBe('Beta')

    const nonTriggerItem = condition.nonTriggerListItem
    expect(nonTriggerItem).not.toBeNull()
    expect(nonTriggerItem.id).not.toBe('b')
    expect(condition.nonTriggerValue).not.toBe('Beta')

    expect(condition.allNonTriggerItems.map((i) => i.id).sort()).toEqual(
      ['a', 'c'].sort()
    )
  })
})
