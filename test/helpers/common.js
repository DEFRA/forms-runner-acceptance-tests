import { slugify } from '@defra/forms-model'
// UUID regex pattern
export const UUID_PATTERN =
  /^(.+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// RepeatPageController summary path suffix
export const REPEAT_SUMMARY_PATTERN = /^(.+)\/summary$/

/**
 * Create the form slug used in runner URLs from a form name.
 * @param {string} formName Form display name.
 * @returns {string} URL slug.
 */
export function createFormSlug(formName) {
  return slugify(formName)
}

/**
 * Find the page definition for a path in a form, including repeat instance and summary paths.
 * @param {{ pages: Array<{ path: string }> }} form Form JSON.
 * @param {string} path Current form-relative path.
 * @returns {object | undefined} Matching page definition.
 */
export function findPageByPath(form, path) {
  let pageDef = form.pages.find((p) => p.path === path)

  // could be repeat page with UUID?
  if (!pageDef) {
    const uuidMatch = path.match(UUID_PATTERN)
    if (uuidMatch) {
      const basePath = uuidMatch[1]
      pageDef = form.pages.find((p) => p.path === basePath)
    }
  }

  // could be summary?
  if (!pageDef) {
    const summaryMatch = path.match(REPEAT_SUMMARY_PATTERN)
    if (summaryMatch) {
      const basePath = summaryMatch[1]
      pageDef = form.pages.find((p) => p.path === basePath)
    }
  }

  return pageDef
}

/**
 * Check if a path is a repeat page summary (ends with /summary under a RepeatPageController page).
 * @param {{ pages: Array<{ path: string, controller?: string }> }} form Form JSON.
 * @param {string} path Current form-relative path.
 * @returns {boolean} True when this is a repeat summary path.
 */
export function isRepeatSummaryPath(form, path) {
  if (!REPEAT_SUMMARY_PATTERN.test(path)) {
    return false
  }
  const basePath = path.replace(/\/summary$/, '')
  const pageDef = form.pages.find((p) => p.path === basePath)
  return pageDef?.controller === 'RepeatPageController'
}

/**
 * Check if a path is a repeat page instance (has UUID suffix).
 * @param {string} path Current form-relative path.
 * @returns {boolean} True when the path ends with a UUID.
 */
export function isRepeatPageInstance(path) {
  return UUID_PATTERN.test(path)
}

/**
 * Extract the form-relative path from a full URL.
 * @param {string} url Full URL.
 * @param {string} formSlug Form slug used in URLs.
 * @param {boolean} previewMode Whether the form is in preview mode.
 * @returns {string} Form-relative path.
 */
export function extractPathFromUrl(url, formSlug, previewMode) {
  const formPrefix = previewMode
    ? `/form/preview/draft/${formSlug}`
    : `/form/${formSlug}`
  const urlObj = new URL(url)
  const pathname = urlObj.pathname

  if (pathname.startsWith(formPrefix)) {
    return pathname.slice(formPrefix.length) || '/'
  }
  return pathname
}

/**
 * Submit button text for SummaryPageWithConfirmationEmailController.
 * @param {object} summaryPageDef Summary page definition from form JSON.
 * @returns {string} Submit button text.
 */
export function summarySubmitButtonText(summaryPageDef) {
  if (
    summaryPageDef?.components?.some(
      (component) => component.type === 'Markdown'
    )
  ) {
    return 'Accept and send'
  }

  return 'Send'
}
