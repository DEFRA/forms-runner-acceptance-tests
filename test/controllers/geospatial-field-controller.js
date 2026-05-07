import { expect } from '@playwright/test'

import { BaseFieldController } from './base-field-controller.js'

const defaultGeospatialFeatures = [
  {
    type: 'Feature',
    properties: {
      description: 'Location one',
      coordinateGridReference: 'SJ 71535 45435',
      centroidGridReference: 'SJ 71535 45435'
    },
    geometry: {
      type: 'Point',
      coordinates: [-2.4256372, 53.0054679]
    },
    id: 'seed-point-feature'
  },
  {
    id: 'seed-polygon-feature',
    type: 'Feature',
    properties: {
      description: 'Location two',
      coordinateGridReference: 'SH 51917 88671',
      centroidGridReference: 'SH 98167 97135'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-4.227395, 53.3740927],
          [-3.5352564, 53.6875389],
          [-2.8431177, 53.3216259],
          [-4.227395, 53.3740927]
        ]
      ]
    }
  },
  {
    id: 'seed-line-feature',
    type: 'Feature',
    properties: {
      description: 'Location three',
      coordinateGridReference: 'SE 08295 03834',
      centroidGridReference: 'SK 50060 79761'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-1.8763208, 53.5311058],
        [-1.2501001, 53.3478674],
        [-0.6238794, 53.0583227]
      ]
    }
  }
]

const mapToolSuffixes = ['btn-add-point', 'btn-add-polygon', 'btn-add-line']

/**
 * Controller for GeospatialField components.
 * Seeds geospatial features into the hidden textarea using the same approach as acceptance tests.
 */
export class GeospatialFieldController extends BaseFieldController {
  /**
   * The geospatial field is backed by a hidden textarea.
   * @returns {Locator} Hidden geospatial textarea locator.
   */
  find() {
    return this.page.locator(`#${this.name}`)
  }

  /**
   * @returns {Locator} The generated map container adjacent to the hidden textarea.
   */
  findMapContainer() {
    return this.page.locator(`#${this.name} + .map-container`)
  }

  /**
   * @returns {Locator} The visible map canvas.
   */
  findMapCanvas() {
    return this.findMapContainer().locator('canvas.maplibregl-canvas').first()
  }

  /**
   * @returns {Locator} Optional help overlay dialog.
   */
  findHelpOverlay() {
    return this.page.getByRole('dialog', { name: 'How to use this map' })
  }

  /**
   * @returns {Promise<string>} Generated map id.
   */
  async getMapId() {
    const mapId = await this.findMapContainer().getAttribute('id')

    if (!mapId) {
      throw new Error(
        `Expected geospatial map container for component ${this.name} to have an id`
      )
    }

    return mapId
  }

  /**
   * @param {string} suffix Button id suffix.
   * @returns {Promise<Locator>} Map action button locator.
   */
  async findMapButton(suffix) {
    const mapId = await this.getMapId()
    return this.page.locator(`#${mapId}-${suffix}`)
  }

  /**
   * @param {Expect} expect Playwright expect function.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async assertions(expect) {
    await expect(this.find()).toBeAttached()
    await expect(this.findMapContainer()).toBeVisible()
    await expect(this.findMapCanvas()).toBeVisible()

    return this
  }

  /**
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async closeMapHelpOverlay() {
    const overlay = this.findHelpOverlay()
    const closeButton = overlay.getByRole('button', {
      name: 'Close How to use this map'
    })

    if (await overlay.isVisible().catch(() => false)) {
      await closeButton.click({ force: true })
      await expect(overlay).toBeHidden()
    }

    return this
  }

  /**
   * @param {string} suffix Button id suffix.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async clickMapButton(suffix) {
    const button = await this.findMapButton(suffix)
    await button.evaluate((element) => {
      element.click()
    })
    return this
  }

  /**
   * @param {string} suffix Button id suffix.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async openMapTool(suffix) {
    await expect(this.findMapCanvas()).toBeVisible()
    await this.clickMapButton(suffix)
    await this.page.waitForTimeout(200)
    return this
  }

  /**
   * @param {Array<object>} features Geospatial features to seed.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async seedFeatures(features) {
    await this.find().evaluate((textarea, nextFeatures) => {
      const field = textarea
      field.value = JSON.stringify(nextFeatures, null, 2)
      field.dispatchEvent(new Event('input', { bubbles: true }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
    }, features)

    return this
  }

  /**
   * @returns {Promise<Array<object>>} Parsed geospatial features from the hidden field.
   */
  async getFeatures() {
    const value = await this.find().inputValue()
    return value ? JSON.parse(value) : []
  }

  /**
   * Fill the geospatial field using seeded feature data.
   * @param {Array<object>} [features=defaultGeospatialFeatures] Features to persist.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async fill(features = defaultGeospatialFeatures) {
    await this.closeMapHelpOverlay()

    for (const suffix of mapToolSuffixes) {
      await this.openMapTool(suffix)
    }

    await this.seedFeatures(features)

    await expect
      .poll(async () => {
        const storedFeatures = await this.getFeatures()
        return storedFeatures.map(
          (feature) => feature.properties?.description ?? ''
        )
      })
      .toEqual(features.map((feature) => feature.properties?.description ?? ''))

    return this
  }

  /**
   * Clears the geospatial field.
   * @returns {Promise<GeospatialFieldController>} Controller instance.
   */
  async clear() {
    await this.seedFeatures([])
    return this
  }
}

/**
 * @import {Expect, Locator} from '@playwright/test'
 */
