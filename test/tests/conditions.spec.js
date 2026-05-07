import { readFile } from 'node:fs/promises'

import { test, expect } from '@playwright/test'

import { createConditionsForForm } from '../conditions'
import { ComponentsInitializer } from '../helpers/components-mapper'

const form = JSON.parse(
  await readFile(new URL('../data/report-death.json', import.meta.url), 'utf8')
)

const conditions = createConditionsForForm(form)
const conditionIds = [...conditions.keys()]
/**
 * Return the condition items array for a mapped condition.
 * @param {object | undefined | null} condition Mapped condition entry.
 * @returns {Array<object>} Condition item entries.
 */
function getConditionItems(condition) {
  if (!condition) return []
  if (Array.isArray(condition.items)) {
    return condition.items
  }
  return [condition]
}

conditionIds.forEach((id) => {
  test(`Maps all items for condition ${conditions.get(id).name}`, async () => {
    const mappedCondition = conditions.get(id)
    const conditionDef = (form.conditions ?? []).find((c) => c.id === id)
    expect(conditionDef).toBeTruthy()

    const mappedItems = getConditionItems(mappedCondition)
    expect(mappedItems).toHaveLength(conditionDef.items.length)

    // Ensure every item in the form definition is present in the mapped items
    for (const itemDef of conditionDef.items) {
      const match = mappedItems.find(
        (m) =>
          m.componentId === itemDef.componentId &&
          m.operator === itemDef.operator
      )
      expect(match).toBeTruthy()
      expect(match.triggerValue).not.toBeNull()

      if (itemDef.type === 'ListItemRef') {
        // For list refs we expect a string label
        expect(typeof match.triggerValue).toBe('string')
      }

      if (itemDef.type === 'NumberValue') {
        // For number conditions we expect a number
        expect(typeof match.triggerValue).toBe('number')
      }
    }
  })
})

test('Associates all related condition items to each component on init', async ({
  page
}) => {
  const conditionItemCountsByComponentId = new Map()
  for (const conditionDef of form.conditions ?? []) {
    for (const item of conditionDef.items ?? []) {
      conditionItemCountsByComponentId.set(
        item.componentId,
        (conditionItemCountsByComponentId.get(item.componentId) ?? 0) + 1
      )
    }
  }

  for (const pageDef of form.pages ?? []) {
    for (const compDef of pageDef.components ?? []) {
      const component = ComponentsInitializer.initializeComponent(
        compDef,
        page,
        form.lists,
        form.conditions
      )

      const expectedCount =
        conditionItemCountsByComponentId.get(compDef.id) ?? 0
      const actualCount = Array.isArray(component.conditions)
        ? component.conditions.length
        : 0
      expect(actualCount).toBe(expectedCount)

      // Sanity check: attached condition items reference this component
      for (const entry of component.conditions ?? []) {
        expect(entry.condition?.componentId).toBe(compDef.id)
        expect(entry.conditionId).toBeTruthy()
        expect(entry.name).toBeTruthy()
      }
    }
  }
})
