import { config } from '../config.js'

/**
 * @typedef {'live' | 'draft'} ManagedFormState
 */

/**
 * @typedef {object} ManagedFormUnderTest
 * @property {string} formId
 * @property {string} formName
 * @property {string} slug
 * @property {boolean} previewMode
 * @property {boolean} hasPaymentField
 * @property {ManagedFormState} state
 * @property {object} metadata
 * @property {object} definition
 */

/**
 * Parse configured form ids from env.
 * @param {string} configuredIds Comma-separated ids.
 * @returns {string[]} Parsed form ids.
 */
function parseConfiguredFormIds(configuredIds) {
  return Array.from(
    new Set(
      configuredIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    )
  )
}

/**
 * Parse configured live form ids from env.
 * @returns {string[]} Live form ids.
 */
export function getLiveFormDefinitionIds() {
  return parseConfiguredFormIds(config.LIVE_FORM_DEFINITION_IDS)
}

/**
 * Parse configured draft form ids from env.
 * @returns {string[]} Draft form ids.
 */
export function getDraftFormDefinitionIds() {
  return parseConfiguredFormIds(config.DRAFT_FORM_DEFINITION_IDS)
}

/**
 * Parse configured submit/live form ids from env.
 * @returns {string[]} Test form ids.
 */
export function getTestFormDefinitionIds() {
  return parseConfiguredFormIds(config.TEST_FORM_DEFINITION_IDS)
}

/**
 * @param {string | URL} url URL to fetch.
 * @returns {Promise<any>} Parsed JSON body.
 */
async function fetchJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * Load a managed form definition and its metadata from forms-manager.
 * @param {string} formId Form id.
 * @param {ManagedFormState} state Form state to load.
 * @returns {Promise<ManagedFormUnderTest>} Loaded form details.
 */
async function loadManagedFormDefinition(formId, state) {
  if (!config.FORMS_MANAGER_URL) {
    throw new Error(
      'FORMS_MANAGER_URL must be set when LIVE_FORM_DEFINITION_IDS, DRAFT_FORM_DEFINITION_IDS or TEST_FORM_DEFINITION_IDS is configured'
    )
  }

  const definitionPath =
    state === 'draft'
      ? `/forms/${formId}/definition/draft`
      : `/forms/${formId}/definition`

  const [metadata, definition] = await Promise.all([
    fetchJson(new URL(`/forms/${formId}`, config.FORMS_MANAGER_URL)),
    fetchJson(new URL(definitionPath, config.FORMS_MANAGER_URL))
  ])

  const hasPaymentField = definition.pages?.some((page) =>
    page.components?.some((component) => component.type === 'PaymentField')
  )

  return {
    formId,
    formName: metadata.title ?? definition.name ?? formId,
    slug: metadata.slug,
    previewMode: state === 'draft',
    hasPaymentField,
    state,
    metadata,
    definition
  }
}

/**
 * Load a live form definition and its metadata from forms-manager.
 * @param {string} formId Live form id.
 * @returns {Promise<ManagedFormUnderTest>} Loaded form details.
 */
export async function loadLiveFormDefinition(formId) {
  return loadManagedFormDefinition(formId, 'live')
}

/**
 * Load a draft form definition and its metadata from forms-manager.
 * @param {string} formId Draft form id.
 * @returns {Promise<ManagedFormUnderTest>} Loaded form details.
 */
export async function loadDraftFormDefinition(formId) {
  return loadManagedFormDefinition(formId, 'draft')
}

/**
 * Load a fully-submitted live form definition and its metadata from forms-manager.
 * @param {string} formId Test form id.
 * @returns {Promise<ManagedFormUnderTest>} Loaded form details.
 */
export async function loadTestFormDefinition(formId) {
  return loadManagedFormDefinition(formId, 'live')
}

/**
 * Load all configured live forms.
 * @returns {Promise<ManagedFormUnderTest[]>} Loaded live forms.
 */
export async function loadConfiguredLiveForms() {
  const formIds = getLiveFormDefinitionIds()

  if (!formIds.length) {
    return []
  }

  return Promise.all(formIds.map((formId) => loadLiveFormDefinition(formId)))
}

/**
 * Load all configured draft forms.
 * @returns {Promise<ManagedFormUnderTest[]>} Loaded draft forms.
 */
export async function loadConfiguredDraftForms() {
  const formIds = getDraftFormDefinitionIds()

  if (!formIds.length) {
    return []
  }

  return Promise.all(formIds.map((formId) => loadDraftFormDefinition(formId)))
}

/**
 * Load all configured submit/live forms.
 * @returns {Promise<ManagedFormUnderTest[]>} Loaded test forms.
 */
export async function loadConfiguredTestForms() {
  const formIds = getTestFormDefinitionIds()

  if (!formIds.length) {
    return []
  }

  return Promise.all(formIds.map((formId) => loadTestFormDefinition(formId)))
}
