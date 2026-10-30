import { config } from '../config.js'
import { createFormSlug } from './common.js'

/**
 * Get an access token for forms-manager from the OIDC provider.
 * Locally this is the OIDC mock from forms-development-tools.
 * @returns {Promise<string>} Access token.
 */
async function getManagerToken() {
  const response = await fetch(config.OIDC_TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: config.OIDC_CLIENT_ID,
      client_secret: config.OIDC_CLIENT_SECRET,
      username: config.OIDC_USERNAME,
      password: config.OIDC_PASSWORD,
      scope: 'openid api://local-test-client/forms.user'
    })
  })

  if (!response.ok) {
    throw new Error(
      `Failed to get a forms-manager token from ${config.OIDC_TOKEN_URL}: ${response.status} ${response.statusText}`
    )
  }

  const { access_token: token } = await response.json()
  return token
}

/**
 * Call forms-manager and return the parsed JSON body.
 * @param {string} path Path on forms-manager.
 * @param {{ method?: string, headers?: Record<string, string>, body?: string }} [init] Fetch options.
 * @returns {Promise<{ status: number, body: object | undefined }>} Response status and body.
 */
async function managerRequest(path, init = {}) {
  const response = await fetch(new URL(path, config.FORMS_MANAGER_URL), init)
  const body = await response.json().catch(() => undefined)

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `forms-manager ${init.method ?? 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body)}`
    )
  }

  return { status: response.status, body }
}

/**
 * Create the form in forms-manager if it doesn't exist, then replace its
 * draft definition with the checked-in one. The form is then available
 * at /form/preview/draft/{slug}/... on the runner.
 * @param {object} definition Form definition JSON from test/data.
 * @returns {Promise<string>} Form slug.
 */
export async function createOrUpdateDraftForm(definition) {
  const slug = createFormSlug(definition.name)
  const token = await getManagerToken()
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  let { status, body: metadata } = await managerRequest(`/forms/slug/${slug}`)

  if (status === 404) {
    ;({ body: metadata } = await managerRequest('/forms', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: definition.name,
        organisation: 'Defra',
        teamName: 'Forms acceptance tests',
        teamEmail: 'forms-acceptance-tests@defra.gov.uk'
      })
    }))
  }

  const { metadata: _metadata, ...draftDefinition } = definition

  await managerRequest(`/forms/${metadata.id}/definition/draft`, {
    method: 'POST',
    headers,
    body: JSON.stringify(draftDefinition)
  })

  return slug
}
