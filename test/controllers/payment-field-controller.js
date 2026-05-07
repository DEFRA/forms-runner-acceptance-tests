import { BaseFieldController } from './base-field-controller.js'
import { config } from '../config.js'

/**
 * Controller for PaymentField components.
 * Payment fields render as a payment summary page rather than a standard input.
 */
export class PaymentFieldController extends BaseFieldController {
  constructor(options) {
    console.info('Initializing PaymentFieldController')
    super(options)
  }
  /**
   * Payment fields do not require local form input before the payment journey starts.
   * @returns {boolean} Always false.
   */
  get isRequired() {
    return false
  }

  /**
   * @returns {string | null} Formatted currency amount.
   */
  get formattedAmount() {
    const amount = this.options?.amount
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return null
    }

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  /**
   * @returns {Locator} Payment page heading.
   */
  findHeading() {
    return this.page.getByRole('heading', {
      name: this.title || 'Payment required'
    })
  }

  /**
   * @returns {Locator} Payment provider CTA button.
   */
  findButton() {
    return this.page.getByRole('button', { name: 'Add payment details' })
  }

  /**
   * @returns {Locator | null} Description locator when configured.
   */
  findDescription() {
    if (!this.options?.description) {
      return null
    }

    return this.page.getByText(this.options.description, { exact: true })
  }

  /**
   * @returns {Locator | null} Amount locator when configured.
   */
  findAmount() {
    if (!this.formattedAmount) {
      return null
    }

    return this.page.getByText(this.formattedAmount, { exact: true })
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<this>} The controller instance.
   */
  async assertions(expect) {
    await expect(this.findHeading()).toBeVisible()

    const description = this.findDescription()

    await expect(description).toBeVisible()

    const amount = this.findAmount()

    await expect(amount).toBeVisible()

    await expect(this.findButton()).toBeVisible()
    await expect(this.findButton()).toBeEnabled()
    return this
  }

  /**
   * Payment pages are terminal within the form journey.
   * The explicit payment-provider step is triggered via startPayment().
   * @returns {Promise<this>} The controller instance.
   */
  async fill() {
    console.info(
      'PaymentFieldController.fill() called - starting payment journey'
    )
    await this.startPayment()
    return this
  }

  /**
   * Starts the external GOV.UK Pay journey.
   * @returns {Promise<this>} The controller instance.
   */
  async startPayment() {
    await this.findButton().click()
    const reachedGovPay = await this.page
      .waitForURL(/payments\.service\.gov\.uk/, {
        timeout: 15000
      })
      .then(() => true)
      .catch(() => false)

    if (!reachedGovPay) {
      return this
    }

    // fill in test card details here if needed in future
    await this.page
      .getByRole('textbox', { name: 'Card number' })
      .fill(config.GOVPAY_TEST_CARD_NUMBER)
    await this.page
      .getByRole('textbox', { name: 'Month' })
      .fill(config.GOVPAY_TEST_CARD_EXPIRY_MONTH)
    await this.page
      .getByRole('textbox', { name: 'Year' })
      .fill(config.GOVPAY_TEST_CARD_EXPIRY_YEAR)
    await this.page
      .getByRole('textbox', { name: 'Name on card' })
      .fill(config.GOVPAY_TEST_CARD_NAME)
    await this.page
      .getByRole('textbox', { name: 'Card security code' })
      .fill(config.GOVPAY_TEST_CARD_CVC)
    await this.page
      .getByRole('textbox', { name: 'Address line 1' })
      .fill(config.GOVPAY_TEST_BILLING_ADDRESS_LINE_1)
    await this.page
      .getByRole('textbox', { name: 'Town or city' })
      .fill(config.GOVPAY_TEST_BILLING_CITY)
    await this.page
      .getByRole('textbox', { name: 'Postcode' })
      .fill(config.GOVPAY_TEST_BILLING_POSTCODE)
    await this.page
      .getByRole('textbox', { name: 'Email' })
      .fill(config.GOVPAY_TEST_EMAIL)
    await this.page.getByRole('button', { name: 'Continue' }).click()
    // wredirect to confirmation page indicates payment success and return to form journey
    await this.page.waitForURL(/confirm$/, {
      timeout: 15000
    })
    await this.page.getByRole('button', { name: 'Confirm payment' }).click()
    // go back to form
    await this.page.waitForURL(/\/form\//, {
      timeout: 15000
    })
    return this
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
