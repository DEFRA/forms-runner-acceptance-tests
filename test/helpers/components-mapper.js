import * as Controllers from '../controllers/index'

import {
  IsCondition,
  IsNotCondition,
  IsMoreThanCondition,
  IsLessThanCondition,
  IsAtLeastCondition,
  IsAtMostCondition
} from '../conditions'

export const componentsMapper = {
  TextField: Controllers.TextFieldController,
  DatePartsField: Controllers.DatePartsFieldController,
  MonthYearField: Controllers.MonthYearFieldController,
  UkAddressField: Controllers.UkAddressFieldController,
  EastingNorthingField: Controllers.EastingNorthingFieldController,
  OsGridRefField: Controllers.OsGridRefFieldController,
  NationalGridFieldNumberField: Controllers.NationalGridFieldNumberController,
  LatLongField: Controllers.LatLongFieldController,
  GeospatialField: Controllers.GeospatialFieldController,
  TelephoneNumberField: Controllers.TelephoneNumberFieldController,
  EmailAddressField: Controllers.EmailAddressFieldController,
  DeclarationField: Controllers.DeclarationFieldController,
  Markdown: Controllers.MarkdownController,
  RadiosField: Controllers.RadioFieldController,
  NumberField: Controllers.NumberFieldController,
  YesNoField: Controllers.YesNoFieldController,
  AutocompleteField: Controllers.AutocompleteFieldController,
  SelectField: Controllers.SelectFieldController,
  CheckboxesField: Controllers.CheckboxesFieldController,
  MultilineTextField: Controllers.MultilineTextFieldController,
  FileUploadField: Controllers.FileUploadFieldController,
  PaymentField: Controllers.PaymentFieldController
  // Add other component mappings here
}

export class ComponentsInitializer {
  /**
   * Initialize a component controller for a component definition.
   * @param {object} componentDefinition Component definition from the form JSON.
   * @param {Page} page Playwright page instance.
   * @param {Array} [lists] - Optional array of lists for components that reference lists.
   * @param {Array} [conditions] - Optional condition definitions.
   * @returns {object} Component controller instance.
   */
  static initializeComponent(
    componentDefinition,
    page,
    lists = [],
    conditions = []
  ) {
    const ComponentClass = componentsMapper[componentDefinition.type]
    if (!ComponentClass) {
      throw new Error(`Unsupported component type: ${componentDefinition.type}`)
    }
    /**
     *  @type {keyof Controllers}
     */
    const component = new ComponentClass({
      ...componentDefinition,
      page
    })
    // if there is a list associated, we can fetch it from the form definition
    if (componentDefinition.list) {
      const listDef = lists.find((l) => l.id === componentDefinition.list)
      if (!listDef) {
        throw new Error(
          `List with ID ${componentDefinition.list} not found for component ${componentDefinition.id}`
        )
      }
      const list = new Controllers.ListController(listDef)
      component.list = list
    }

    // Attach any conditions that reference this component
    if (Array.isArray(conditions) && conditions.length > 0) {
      const componentConditions = ConditionMapper.getConditionItemsForComponent(
        componentDefinition.id,
        conditions,
        { lists, formDefinition: undefined, page }
      )
      component.conditions = Array.isArray(componentConditions)
        ? componentConditions
        : [componentConditions]
    }
    return component
  }
}

/**
 * Map and create condition instances from form JSON.
 * This keeps operator->class mapping colocated with other form JSON mappers.
 */
export class ConditionMapper {
  /**
   * Map of operators to their condition classes
   */
  static CONDITION_MAP = {
    is: IsCondition,
    'is not': IsNotCondition,
    'is more than': IsMoreThanCondition,
    'is less than': IsLessThanCondition,
    'is at least': IsAtLeastCondition,
    'is at most': IsAtMostCondition
  }

  /**
   * Create a condition item instance from a condition item definition.
   * @param {object} conditionDef Condition definition.
   * @param {object} item Condition item definition.
   * @param {object} formDefinition Form definition.
   * @param {Page} [page] Playwright page instance.
   * @returns {object | null} Condition item instance, or null when unsupported.
   */
  static createConditionItem(conditionDef, item, formDefinition, page) {
    const ConditionClass = this.CONDITION_MAP[item.operator]
    if (!ConditionClass) {
      console.warn(`No condition class found for operator: ${item.operator}`)
      return null
    }

    // Create a ListController if this is a ListItemRef type
    let listController
    if (item.type === 'ListItemRef') {
      const listId = item?.value?.listId
      const listDef = listId
        ? (formDefinition.lists ?? []).find((l) => l.id === listId)
        : this.findListForComponent(formDefinition, item.componentId)

      if (!listDef) {
        throw new Error(
          `List not found for ListItemRef condition item ${item.id} (component ${item.componentId})`
        )
      }

      listController = new Controllers.ListController({
        id: listDef.id,
        name: listDef.name,
        title: listDef.title,
        type: listDef.type,
        items: listDef.items
      })
    }

    return new ConditionClass({
      page,
      // Keep condition id stable (this is what pages reference)
      id: conditionDef.id,
      name: conditionDef.displayName,
      operator: item.operator,
      componentId: item.componentId,
      value: item.value,
      type: item.type,
      list: listController
    })
  }

  /**
   * Find the list associated with a component
   * @param {object} formDefinition Form definition.
   * @param {string} componentId Component id.
   * @returns {object | undefined} Matching list definition, if any.
   */
  static findListForComponent(formDefinition, componentId) {
    for (const page of formDefinition.pages ?? []) {
      if (!page.components || page.components.length === 0) continue
      const component = page.components.find((c) => c.id === componentId)
      if (component?.list) {
        const list = (formDefinition.lists ?? []).find(
          (l) => l.id === component.list
        )
        if (list) {
          return list
        }
        throw new Error(
          `List with ID ${component.list} not found for component ${componentId}`
        )
      }
    }
    return undefined
  }

  /**
   * Create a condition instance from a condition definition
   * Note: currently uses the first condition item only (mirrors previous behavior).
   * @param {object} conditionDef Condition definition.
   * @param {object} formDefinition Form definition.
   * @param {Page} [page] Playwright page instance.
   * @returns {object | null} Condition instance, or null when not mappable.
   */
  static createCondition(conditionDef, formDefinition, page) {
    const items = conditionDef?.items ?? []
    if (items.length === 0) {
      console.warn(
        `Condition ${conditionDef?.displayName ?? '(unknown)'} has no items`
      )
      return null
    }

    // Single item condition: preserve previous API shape
    if (items.length === 1) {
      return this.createConditionItem(
        conditionDef,
        items[0],
        formDefinition,
        page
      )
    }

    // Multi-item condition: return a composite wrapper that exposes the item instances
    const mappedItems = items
      .map((item) =>
        this.createConditionItem(conditionDef, item, formDefinition, page)
      )
      .filter(Boolean)

    if (mappedItems.length === 0) {
      return null
    }

    return {
      id: conditionDef.id,
      name: conditionDef.displayName,
      coordinator: conditionDef.coordinator,
      items: mappedItems,
      get componentIds() {
        return mappedItems.map((c) => c.componentId)
      }
    }
  }

  /**
   * Create all condition instances for a form
   * @param {object} formDefinition Form definition.
   * @param {Page} [page] Playwright page instance.
   * @returns {Map<string, object>} Conditions map by condition id.
   */
  static createConditionsForForm(formDefinition, page) {
    const conditionsMap = new Map()

    for (const conditionDef of formDefinition.conditions ?? []) {
      const condition = this.createCondition(conditionDef, formDefinition, page)
      if (condition) {
        conditionsMap.set(conditionDef.id, condition)
      }
    }

    return conditionsMap
  }

  /**
   * Returns all condition items (as mapped condition instances) that reference a specific component.
   * This is used to attach relevant conditions to a component at initialization time.
   * @param {string} componentId Component id.
   * @param {Array} conditionsDefinition Condition definitions.
   * @param {{lists?: Array, formDefinition?: object, page?: Page}} context Mapping context.
   * @returns {Array<{conditionId: string, name: string, coordinator?: string, itemId: string, condition: object}>} Condition items for the component.
   */
  static getConditionItemsForComponent(
    componentId,
    conditionsDefinition,
    context = {}
  ) {
    const { lists = [], formDefinition, page } = context

    // Minimal form definition for list lookups via ListItemRef.value.listId
    const dummyFormDefinition = formDefinition ?? {
      lists,
      pages: [],
      conditions: conditionsDefinition
    }

    const results = []
    const allConditions = conditionsDefinition ?? []
    for (const conditionDef of allConditions) {
      const conditionItems = conditionDef?.items ?? []
      for (const item of conditionItems) {
        if (item.componentId !== componentId) continue
        const conditionInstance = this.createConditionItem(
          conditionDef,
          item,
          dummyFormDefinition,
          page
        )

        if (!conditionInstance) continue

        results.push({
          conditionId: conditionDef.id,
          name: conditionDef.displayName,
          coordinator: conditionDef.coordinator,
          itemId: item.id,
          condition: conditionInstance
        })
      }
    }

    return results
  }

  /**
   * Get the condition that controls a specific page
   * @param {object} pageDef Page definition.
   * @param {Map<string, object>} conditionsMap Conditions map.
   * @returns {object | undefined} Condition instance for the page.
   */
  static getConditionForPage(pageDef, conditionsMap) {
    if (!pageDef?.condition) {
      return undefined
    }
    return conditionsMap.get(pageDef.condition)
  }

  /**
   * Get list of supported operators
   * @returns {string[]} Supported operators.
   */
  static getSupportedOperators() {
    return Object.keys(this.CONDITION_MAP)
  }
}

/**
 * @import {Page} from '@playwright/test'
 */
