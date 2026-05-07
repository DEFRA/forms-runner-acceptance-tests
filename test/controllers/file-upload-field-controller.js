import { expect } from '@playwright/test'

import { BaseFieldController } from './base-field-controller.js'
const MimeTypeMap = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  txt: 'text/plain'
}

/**
 * Create a buffer with sample file content
 * @returns {Buffer} Buffer.
 */
const createFileBuffer = () => {
  return Buffer.from('Sample file content', 'utf-8')
}
/**
 * Create a file object for upload
 * @param {string} fileName - The name of the file
 * @returns {{name: string, mimeType: string, buffer: Buffer}}
 */

const createFile = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  const mimeType = MimeTypeMap[extension] || 'application/octet-stream'
  return {
    name: fileName,
    mimeType,
    buffer: createFileBuffer()
  }
}

/**
 * Controller for FileUploadField components.
 * Overrides find(), fill(), assertions(), clear() for file-specific behavior.
 */
export class FileUploadFieldController extends BaseFieldController {
  /**
   * Find the file input element by name attribute
   * @returns {Locator} File input locator.
   */
  find() {
    // File inputs in GOV.UK forms typically use id attribute
    return this.page.locator(`input[type="file"][id="${this.name}"]`)
  }

  /**
   * Find the file input by label text
   * @returns {Locator} File input locator.
   */
  findByLabel() {
    return this.page.getByLabel(this.title)
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<FileUploadFieldController>} The controller instance for chaining.
   */
  async assertions(expect) {
    const element = this.find()
    await expect(element).toBeAttached()
    return this
  }

  /**
   *
   * @returns {Promise<FileUploadFieldController>} The controller instance for chaining.
   */
  async uploadFile() {
    const mimeType =
      this.getAcceptedTypes()?.split(',')[0].trim() || 'text/plain'
    const fileExtensionMap = Object.entries(MimeTypeMap)
    const extension =
      fileExtensionMap.find(([_ext, type]) => type === mimeType)?.[0] || 'txt'
    const fileName = `test-file.${extension}`
    const file = createFile(fileName)
    await this.find().setInputFiles(file)
    return this
  }

  async clickUploadButton() {
    const uploadButton = this.page.getByRole('button', {
      name: /upload file/i
    })
    await uploadButton.click()
    // wait for upload to complete if necessary
    await expect
      .poll(
        async () => {
          const count = await this.page
            .getByText('1 file uploaded', { exact: true })
            .count()
          return count > 0
        },
        {
          timeout: 15000,
          interval: 1000,
          message: 'Waiting for file to be uploaded'
        }
      )
      .toBe(true)
    await this.page.waitForLoadState('networkidle')
    return this
  }

  async uploadFiles() {
    const mimeType =
      this.getAcceptedTypes()?.split(',')[0]?.trim() || 'text/plain'
    const fileExtensionMap = Object.entries(MimeTypeMap)
    const extension =
      fileExtensionMap.find(([_ext, type]) => type === mimeType)?.[0] || 'txt'
    const fileName = `test-file.${extension}`
    const file1 = createFile(fileName)
    const file2 = createFile(`second-${fileName}`)
    const files = [file1, file2]
    await this.find().setInputFiles(files)
    return this
  }

  /**
   * Fill method for compatibility with component filling logic
   * @param {string | string[]} value - File path or array of file paths to upload
   * @returns {Promise<FileUploadFieldController>} The controller instance for chaining.
   */
  async fill(value) {
    if (Array.isArray(value)) {
      await this.uploadFiles()
    } else {
      await this.uploadFile(value)
    }
    await this.clickUploadButton()
    return this
  }

  /**
   * Clear the file input (remove selected files)
   * @returns {Promise<FileUploadFieldController>} The controller instance for chaining.
   */
  async clear() {
    await this.find().setInputFiles([])
    return this
  }

  /**
   * Get the accepted file types for this input
   * @returns {string | undefined} Accept attribute string.
   */
  getAcceptedTypes() {
    return this.options?.accept
  }

  /**
   * Check if a specific file type is accepted
   * @param {string} mimeType - The MIME type to check (e.g., 'application/pdf')
   * @returns {boolean} True when accepted.
   */
  isFileTypeAccepted(mimeType) {
    const accepted = this.getAcceptedTypes()
    if (!accepted) {
      return true // No restriction means all types accepted
    }
    return accepted.split(',').some((type) => {
      const trimmedType = type.trim()
      if (trimmedType === '*/*') return true
      if (trimmedType.endsWith('/*')) {
        const category = trimmedType.slice(0, -2)
        return mimeType.startsWith(category)
      }
      return trimmedType === mimeType
    })
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
