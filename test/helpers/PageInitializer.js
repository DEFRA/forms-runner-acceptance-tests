import { ComponentsInitializer } from './components-mapper'

/**
 * Initialize component helpers for a page definition.
 * @param {object} pageDef Page definition from the form JSON.
 * @param {Page} page Playwright page instance.
 * @param {object} options Optional mapper context.
 * @param {object} [options.lists] Lists from the form definition.
 * @param {object} [options.conditions] Conditions from the form definition.
 * @returns {Promise<Array<BaseFieldController>>} Initialized controllers.
 */
export async function initializeComponentsForPage(pageDef, page, options = {}) {
  const { lists, conditions } = options

  const components = pageDef.components
  if (!components || components.length === 0) {
    throw new Error(`No components found on page: ${pageDef.path}`)
  }

  return components.map((componentDef) =>
    ComponentsInitializer.initializeComponent(
      componentDef,
      page,
      lists,
      conditions
    )
  )
}

/**
 * Fill initialized components with provided test data.
 * Special-cases some component types with bespoke helper methods.
 * @param {Array<BaseFieldController>} initializedComponents Controllers to fill.
 * @param {Record<string, unknown>} componentData Test data keyed by component type.
 * @param {string} [conditionId] Optional condition ID for logging.
 * @param {boolean} [onlyFillRequired] Whether to fill only required components.
 */
export async function fillInitializedComponents(
  initializedComponents,
  componentData,
  conditionId,
  onlyFillRequired = false
) {
  for (const component of initializedComponents) {
    let componentFillValue = null
    if (
      component.conditions &&
      conditionId &&
      component.conditions.some((cond) => cond.conditionId === conditionId)
    ) {
      const condition = component.conditions.find(
        (cond) => cond.conditionId === conditionId
      )
      componentFillValue = condition.condition.triggerValue
    }
    if (onlyFillRequired && !component.isRequired) {
      continue
    }
    if (component.type === 'FileUploadField') {
      await component.uploadFile()
      await component.clickUploadButton()
      continue
    }

    if (component.type === 'RadiosField') {
      componentFillValue == null
        ? await component.selectFirstOption()
        : await component.fill(componentFillValue)
      continue
    }

    if (component.type === 'YesNoField') {
      componentFillValue == null
        ? await component.selectOption.apply(
            component,
            componentData[component.type]
          )
        : await component.selectOption.apply(
            component,
            componentFillValue === true ? ['Yes'] : ['No']
          )

      continue
    }
    if ('fill' in component && typeof component.fill === 'function') {
      await component.fill.apply(
        component,
        componentFillValue == null
          ? componentData[component.type]
          : [componentFillValue]
      )
    }
  }
}

/**
 * @import {Page} from '@playwright/test'
 * @import {BaseFieldController} from '../controllers/base-field-controller.js'
 */
