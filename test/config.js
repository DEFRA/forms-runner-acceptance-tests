import joi from 'joi'
import dotenv from 'dotenv'

dotenv.config()

const configuredIdsSchema = joi.string().allow('').optional().default('')

export const configSchema = joi
  .object({
    TEST_ENVIRONMENT: joi
      .string()
      .allow('local', 'test', 'prod')
      .default('local'),
    TIMEOUT: joi.number().default(30000),
    FORMS_MANAGER_URL: joi.string().uri().allow('').optional().default(''),
    LIVE_FORM_DEFINITION_IDS: configuredIdsSchema,
    DRAFT_FORM_DEFINITION_IDS: configuredIdsSchema,
    TEST_FORM_DEFINITION_IDS: configuredIdsSchema,
    GOVPAY_TEST_CARD_NUMBER: joi.string().required(),
    GOVPAY_TEST_CARD_EXPIRY_MONTH: joi.string().required(),
    GOVPAY_TEST_CARD_EXPIRY_YEAR: joi.string().required(),
    GOVPAY_TEST_CARD_NAME: joi.string().required(),
    GOVPAY_TEST_CARD_CVC: joi.string().required(),
    GOVPAY_TEST_BILLING_ADDRESS_LINE_1: joi.string().required(),
    GOVPAY_TEST_BILLING_CITY: joi.string().required(),
    GOVPAY_TEST_BILLING_POSTCODE: joi.string().required(),
    GOVPAY_TEST_EMAIL: joi.string().email().required(),
    FORMS_RUNNER_URL: joi.string().uri().allow('').optional().default('')
  })
  .prefs({ convert: true, abortEarly: false })

/**
 *  @typedef {object} config
 *  @property {string} TEST_ENVIRONMENT Test environment name.
 *  @property {number} TIMEOUT Default timeout in milliseconds.
 *  @property {string} FORMS_MANAGER_URL Forms Manager base URL for loading form definitions.
 *  @property {string} LIVE_FORM_DEFINITION_IDS Comma-separated live form definition IDs to test.
 *  @property {string} DRAFT_FORM_DEFINITION_IDS Comma-separated draft form definition IDs to test.
 *  @property {string} TEST_FORM_DEFINITION_IDS Comma-separated live form definition IDs to fully submit.
 *  @property {string} GOVPAY_TEST_CARD_NUMBER GOV.UK Pay test card number.
 *  @property {string} GOVPAY_TEST_CARD_EXPIRY_MONTH GOV.UK Pay test expiry month.
 *  @property {string} GOVPAY_TEST_CARD_EXPIRY_YEAR GOV.UK Pay test expiry year.
 *  @property {string} GOVPAY_TEST_CARD_NAME GOV.UK Pay test cardholder name.
 *  @property {string} GOVPAY_TEST_CARD_CVC GOV.UK Pay test card security code.
 *  @property {string} GOVPAY_TEST_BILLING_ADDRESS_LINE_1 GOV.UK Pay billing address line 1.
 *  @property {string} GOVPAY_TEST_BILLING_CITY GOV.UK Pay billing town or city.
 *  @property {string} GOVPAY_TEST_BILLING_POSTCODE GOV.UK Pay billing postcode.
 *  @property {string} GOVPAY_TEST_EMAIL GOV.UK Pay confirmation email.
 *  @property {string} FORMS_RUNNER_URL Forms Runner base URL.
 */
/**
 * @type {config}
 */
export const config = joi.attempt(
  {
    TEST_ENVIRONMENT: process.env.TEST_ENVIRONMENT,
    TIMEOUT: process.env.TIMEOUT,
    FORMS_MANAGER_URL: process.env.FORMS_MANAGER_URL,
    LIVE_FORM_DEFINITION_IDS: process.env.LIVE_FORM_DEFINITION_IDS,
    DRAFT_FORM_DEFINITION_IDS: process.env.DRAFT_FORM_DEFINITION_IDS,
    TEST_FORM_DEFINITION_IDS: process.env.TEST_FORM_DEFINITION_IDS,
    GOVPAY_TEST_CARD_NUMBER: process.env.GOVPAY_TEST_CARD_NUMBER,
    GOVPAY_TEST_CARD_EXPIRY_MONTH: process.env.GOVPAY_TEST_CARD_EXPIRY_MONTH,
    GOVPAY_TEST_CARD_EXPIRY_YEAR: process.env.GOVPAY_TEST_CARD_EXPIRY_YEAR,
    GOVPAY_TEST_CARD_NAME: process.env.GOVPAY_TEST_CARD_NAME,
    GOVPAY_TEST_CARD_CVC: process.env.GOVPAY_TEST_CARD_CVC,
    GOVPAY_TEST_BILLING_ADDRESS_LINE_1:
      process.env.GOVPAY_TEST_BILLING_ADDRESS_LINE_1,
    GOVPAY_TEST_BILLING_CITY: process.env.GOVPAY_TEST_BILLING_CITY,
    GOVPAY_TEST_BILLING_POSTCODE: process.env.GOVPAY_TEST_BILLING_POSTCODE,
    GOVPAY_TEST_EMAIL: process.env.GOVPAY_TEST_EMAIL,
    FORMS_RUNNER_URL: process.env.FORMS_RUNNER_URL
  },
  configSchema
)
