import { readFile } from 'node:fs/promises'

import { test as setup } from '@playwright/test'

import { createOrUpdateDraftForm } from '../helpers/local-form-setup.js'

const { form } = JSON.parse(
  await readFile(
    new URL('../data/visual-targets.json', import.meta.url),
    'utf8'
  )
)
const definition = JSON.parse(
  await readFile(new URL(`../data/${form}`, import.meta.url), 'utf8')
)

setup('create the visual regression form as a draft', async () => {
  await createOrUpdateDraftForm(definition)
})
