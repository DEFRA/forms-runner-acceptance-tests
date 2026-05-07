import { BaseCompositeFieldController } from './base-field-controller.js'
import { expect } from '@playwright/test'

/**
 * Controller for UkAddressField components (multi-field address input).
 * Extends BaseCompositeFieldController which provides constructor and isRequired().
 */
export class UkAddressFieldController extends BaseCompositeFieldController {
  usesPostcodeLookup() {
    return this.options?.usePostcodeLookup === true
  }

  /**
   * @returns {Locator} Address line 1 input.
   */
  findAddressLine1() {
    return this.page.locator(`#${this.name}__addressLine1`)
  }

  /**
   * @returns {Locator} Address line 2 input.
   */
  findAddressLine2() {
    return this.page.locator(`#${this.name}__addressLine2`)
  }

  /**
   * @returns {Locator} Town/city input.
   */
  findTownOrCity() {
    return this.page.locator(`#${this.name}__town`)
  }

  /**
   * @returns {Locator} County input.
   */
  findCounty() {
    return this.page.locator(`#${this.name}__county`)
  }

  /**
   * @returns {Locator} Postcode input.
   */
  findPostcode() {
    return this.page.locator(`#${this.name}__postcode`)
  }

  /**
   * @returns {Locator} Address fieldset group.
   */
  findFieldset() {
    return this.page.getByRole('group', { name: this.title })
  }

  /**
   * For postcode lookup mode.
   * @returns {Locator} Postcode lookup input.
   */
  findPostcodeLookupInput() {
    return this.page.locator(`#${this.name}__postcode`)
  }

  /**
   * For postcode lookup mode.
   * @returns {Locator} Find address button.
   */
  findFindAddressButton() {
    return this.page.locator(`#${this.name}__findAddress`)
  }

  /**
   * For postcode lookup mode.
   * @returns {Locator} Address dropdown.
   */
  findAddressDropdown() {
    return this.page.getByRole('combobox', { name: 'Select an address' })
  }

  /**
   * @param {Expect} expect Playwright expect function used for assertions.
   * @returns {Promise<UkAddressFieldController>} // for chaining
   */
  async assertions(expect) {
    const fieldset = this.findFieldset()
    await expect(fieldset).toBeVisible()

    if (this.usesPostcodeLookup()) {
      await expect(this.findPostcodeLookupInput()).toBeVisible()
      await expect(this.findFindAddressButton()).toBeVisible()
    } else {
      await expect(this.findAddressLine1()).toBeVisible()
      await expect(this.findAddressLine1()).toBeEnabled()
      await expect(this.findTownOrCity()).toBeVisible()
      await expect(this.findTownOrCity()).toBeEnabled()
      await expect(this.findPostcode()).toBeVisible()
      await expect(this.findPostcode()).toBeEnabled()
    }

    return this
  }

  /**
   * @typedef {object} AddressDetails
   * @property {string} addressLine1 First line of the address (e.g. building and street).
   * @property {string} [addressLine2] Second line of the address (optional).
   * @property {string} townOrCity Town or city name.
   * @property {string} [county] County name (optional).
   * @property {string} postcode UK postcode.
   * @param {AddressDetails} address Address details to enter into the form.
   * @returns {Promise<UkAddressFieldController>} The controller instance for chaining.
   */
  async fill(address) {
    if (this.usesPostcodeLookup()) {
      await this.fillPostcode(address.postcode)
      return this
    }
    await this.findAddressLine1().fill(address.addressLine1)
    if (address.addressLine2) {
      await this.findAddressLine2().fill(address.addressLine2)
    }
    await this.findTownOrCity().fill(address.townOrCity)
    if (address.county) {
      await this.findCounty().fill(address.county)
    }
    await this.findPostcode().fill(address.postcode)
    return this
  }

  /**
   * For postcode lookup mode - fill in the postcode and trigger lookup
   * @param {string} postcode The postcode to fill in.
   * @returns {Promise<UkAddressFieldController>} The controller instance for chaining.
   */
  async fillPostcode(postcode) {
    const componentRoot = this.page.locator(`#${this.name}`)
    await componentRoot.waitFor({ state: 'visible' })

    const findAddressButton = componentRoot.getByRole('button', {
      name: /find an address/i
    })

    // The button can be enabled after client-side hydration; let Playwright auto-wait.
    await expect(findAddressButton).toBeVisible()
    await expect(findAddressButton).toBeEnabled()

    await findAddressButton.click()

    // Postcode lookup is typically a separate step/page.
    await this.page.waitForURL(/postcode-lookup/i, { timeout: 15000 })

    const postcodeInput = this.page.getByRole('textbox', {
      name: /^postcode$/i
    })
    await expect(postcodeInput).toBeVisible()
    await postcodeInput.fill(postcode)

    const buildingInput = this.page.getByRole('textbox', {
      name: /building name or number/i
    })
    if ((await buildingInput.count()) > 0) {
      await buildingInput.fill('1')
    }

    const findLookupButton = this.page.getByRole('button', {
      name: /^find address$/i
    })
    await expect(findLookupButton).toBeEnabled()
    await findLookupButton.click()

    const addressDropdown = this.page.getByRole('combobox', {
      name: /select an address/i
    })

    if ((await addressDropdown.count()) > 0) {
      await expect(addressDropdown).toBeEnabled()

      const dropdownHandle = await addressDropdown.elementHandle()
      if (dropdownHandle) {
        await this.page.waitForFunction(
          (el) =>
            !!el &&
            el.tagName === 'SELECT' &&
            'options' in el &&
            el.options.length > 1,
          dropdownHandle,
          { timeout: 15000 }
        )
      }

      await addressDropdown.selectOption({ index: 1 })
    }

    const useAddressButton = this.page.getByRole('button', {
      name: /use this address/i
    })
    await expect(useAddressButton).toBeEnabled()
    await useAddressButton.click()

    await this.page.waitForURL(/\/form\//i, { timeout: 15000 })

    // Avoid `networkidle` here; the page can keep connections open.
    // Instead, wait until we're back on the form page and this component is present again.
    await this.page.locator(`#${this.name}`).waitFor({ state: 'visible' })
    return this
  }

  /**
   * For postcode lookup mode - search for an address
   * @param {string} postcode The postcode to search for.
   * @returns {Promise<UkAddressFieldController>} The controller instance for chaining.
   */
  async searchPostcode(postcode) {
    await this.findPostcodeLookupInput().fill(postcode)
    await this.findFindAddressButton().click()
    return this
  }

  /**
   * For postcode lookup mode - select an address from dropdown
   * @param {string} addressText The visible label of the address option to select.
   * @returns {Promise<UkAddressFieldController>} The controller instance for chaining.
   */
  async selectAddress(addressText) {
    await this.findAddressDropdown().selectOption({ label: addressText })
    return this
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
