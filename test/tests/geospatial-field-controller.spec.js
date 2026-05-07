import { test, expect } from '@playwright/test'

import { GeospatialFieldController } from '../controllers/geospatial-field-controller.js'

const geospatialMarkup = `
  <main>
    <form>
      <h1>Add all the barn locations</h1>
      <div>
        <textarea id="tHYIXp" name="tHYIXp" class="govuk-textarea js-hidden"></textarea>
        <div id="geospatialmap_0" class="map-container">
          <canvas class="maplibregl-canvas"></canvas>
        </div>
        <div id="geospatialmap_0_list"></div>
      </div>
      <button type="button" id="geospatialmap_0-btn-add-point">Add point</button>
      <button type="button" id="geospatialmap_0-btn-add-polygon">Add shape</button>
      <button type="button" id="geospatialmap_0-btn-add-line">Add line</button>
      <div role="dialog" aria-label="How to use this map">
        <button
          type="button"
          aria-label="Close How to use this map"
          onclick="this.parentElement.setAttribute('hidden', '')"
        >
          Close
        </button>
      </div>
    </form>
  </main>
`

test.describe('GeospatialFieldController', () => {
  test('asserts the hidden field and rendered map', async ({ page }) => {
    await page.setContent(geospatialMarkup)

    const controller = new GeospatialFieldController({
      title: 'Add all the barn locations',
      page,
      name: 'tHYIXp',
      type: 'GeospatialField',
      hint: 'You can add points, shapes or lines to the map.',
      options: {
        required: true
      }
    })

    await controller.assertions(expect)
  })

  test('fills the geospatial field with seeded features', async ({ page }) => {
    await page.setContent(geospatialMarkup)

    const controller = new GeospatialFieldController({
      title: 'Add all the barn locations',
      page,
      name: 'tHYIXp',
      type: 'GeospatialField',
      options: {
        required: true
      }
    })

    await controller.fill()

    const storedFeatures = await controller.getFeatures()
    expect(storedFeatures).toHaveLength(3)
    expect(
      storedFeatures.map((feature) => feature.properties.description)
    ).toEqual(['Location one', 'Location two', 'Location three'])
    await expect(
      page.getByRole('dialog', { name: 'How to use this map' })
    ).toBeHidden()
  })

  test('clears seeded geospatial features', async ({ page }) => {
    await page.setContent(geospatialMarkup)

    const controller = new GeospatialFieldController({
      title: 'Add all the barn locations',
      page,
      name: 'tHYIXp',
      type: 'GeospatialField',
      options: {
        required: true
      }
    })

    await controller.fill()
    await controller.clear()

    await expect(page.locator('#tHYIXp')).toHaveValue('[]')
  })
})
