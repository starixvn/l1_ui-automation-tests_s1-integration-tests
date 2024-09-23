import { expect, Locator, Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'

export class PlatformReportPage extends AbstractPage {
  // readonly page: Page
  readonly marketReport: Locator
  readonly orderTracking: Locator
  readonly balanceChangeReport: Locator
  readonly btnSubmit: Locator
  readonly btnSearch: Locator
  readonly inputUsername: Locator
  readonly txtBetAmount: Locator
  readonly txtWinLoss: Locator
  readonly txtStatus: Locator

  constructor(page: Page) {
    super(page)
    this.marketReport = page.locator(`//a[text()="Market Report"]`)
    this.orderTracking = page.locator(`//a[text()="Order Tracking"]`)
    this.balanceChangeReport = page.locator(
      `//a[text()="Balance Change Report"]`
    )
    this.btnSubmit = page.locator(`text=Submit`)
    this.btnSearch = page.locator(`//button/span[text()="Search"]`)
    this.inputUsername = page.locator(`input[name="username"]`)
    this.txtBetAmount = page.locator(
      `//div[@id="game-round-dialog"]/div[contains(@id,"id")]/div/div[2]/div[3]/div[1]//div[3]`
    )
    this.txtWinLoss = page.locator(
      `//div[@id="game-round-dialog"]/div[contains(@id,"id")]/div/div[2]/div[3]/div[1]//div[7]`
    )
    this.txtStatus = page.locator(
      `//div[@id="game-round-dialog"]/div[contains(@id,"id")]/div/div[2]/div[3]/div[1]//div[8]`
    )
  }

  async selectOrderTracking() {
    await this.orderTracking.click()
  }

  async filterbyPlatform(platform: string = 'GMO') {
    await this.page.selectOption('select[name="brandId"]', { label: platform })
    await this.btnSubmit.click()
  }

  async filterbyUsername(username: string) {
    await this.inputUsername.type(username)
    await this.btnSearch.click()
    await this.page.waitForTimeout(1000)
  }

  async openTicketDetail(id: string) {
    await this.page
      .locator(
        `//td[@data-content="External ID"]//span[text()="${id}"]/following::td[13]//button[1]`
      )
      .click()
    await this.page.waitForTimeout(1500)
  }

  async closeTicketDetail() {
    await this.page
      .locator(`//div[@id="game-round-dialog"]/div[contains(@id,"id")]//button`)
      .click()
    await this.page.waitForTimeout(500)
  }

  async verifyTicketDetail(expectedData: {
    Id: string
    betAmount: string
    status: string
    winloss: string
  }) {
    await this.openTicketDetail(expectedData.Id)
    console.log(
      expectedData.winloss,
      await this.page
        .locator(
          '//div[@id="game-round-dialog"]/div[contains(@id,"id")]/div/div[2]/div[3]/div[1]//div[7]'
        )
        .innerText(),
      await this.page
        .locator(
          '//div[@id="game-round-dialog"]/div[contains(@id,"id")]/div/div[2]/div[3]/div[1]//div[8]'
        )
        .innerText()
    )

    const actualText = await this.txtWinLoss.innerText()
    const expectedText = parseFloat(expectedData.winloss).toFixed(1)
    await expect(parseFloat(actualText).toFixed(1)).toBe(expectedText)
    await expect(this.txtBetAmount).toHaveText(expectedData.betAmount)
    await expect(this.txtStatus).toHaveText(expectedData.status)

    await this.closeTicketDetail()
  }
}
