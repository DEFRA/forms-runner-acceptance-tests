export class MarkdownController {
  /**
   * Controller for Markdown display components (read-only content).
   * @param {object} options Options.
   * @param {string} options.content The markdown content.
   * @param {Page} options.page Playwright page.
   * @param {string} options.type Component type.
   * @param {string} options.id Component id.
   */
  constructor({ content, page, type, id }) {
    this.content = content
    this.page = page
    this.id = id
    this.type = type
  }

  /**
   * Markdown components are display-only and not required for form submission
   * @returns {boolean} Always false.
   */
  get isRequired() {
    return false
  }

  /**
   * Find the markdown content container
   * @returns {Locator} Content container locator.
   */
  find() {
    return this.page.locator(`[data-component-id="${this.id}"]`)
  }

  /**
   * Find by text content within the markdown
   * @param {string} text Text to find.
   * @returns {Locator} Matching text locator.
   */
  findByText(text) {
    return this.page.getByText(text)
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<this>} The controller instance.
   */
  async assertions(expect) {
    // Check that the markdown content text is visible on the page
    const textToFind = this.content.substring(0, 50).trim()
    if (textToFind) {
      const element = this.findByText(textToFind)
      await expect(element).toBeVisible()
    }
    return this
  }

  /**
   * Check if specific text is present in the markdown content
   * @param {Expect} expect Playwright expect function.
   * @param {string} text Text to assert.
   * @returns {Promise<this>} The controller instance.
   */
  async assertContainsText(expect, text) {
    const element = this.findByText(text)
    await expect(element).toBeVisible()
    return this
  }
}

/**
 * @import {Expect, Locator, Page} from '@playwright/test'
 */
