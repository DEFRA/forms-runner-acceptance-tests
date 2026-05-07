import { test, expect } from '@playwright/test'

import { PaymentFieldController } from '../controllers/payment-field-controller.js'

const paymentPageMarkup = `
  <main>
    <div>
      <h2>Payment required</h2>
      <p>Your are required to pay GBP10 to use our services</p>
      <div role="alert">
        <strong>
          <span>Warning</span>
          You may see a pending transaction in your bank account but you will only be charged when you submit the form.
        </strong>
      </div>
      <p>Total amount:</p>
      <p>£10.00</p>
      <button type="button" onclick="window.__paymentStarted = true">Add payment details</button>
    </div>
  </main>
`

test.describe('PaymentFieldController', () => {
  test('asserts the payment page content', async ({ page }) => {
    await page.setContent(paymentPageMarkup)

    const controller = new PaymentFieldController({
      title: 'Payment required',
      page,
      name: 'paymentField',
      type: 'PaymentField',
      options: {
        amount: 10,
        description: 'Your are required to pay GBP10 to use our services'
      }
    })

    await controller.assertions(expect)
  })

  test('starts the payment journey when requested', async ({ page }) => {
    await page.setContent(paymentPageMarkup)

    const controller = new PaymentFieldController({
      title: 'Payment required',
      page,
      name: 'paymentField',
      type: 'PaymentField',
      options: {
        amount: 10,
        description: 'Your are required to pay GBP10 to use our services'
      }
    })

    await controller.startPayment()

    await expect
      .poll(async () =>
        page.evaluate(() => Boolean(globalThis.__paymentStarted))
      )
      .toBe(true)
  })
})
