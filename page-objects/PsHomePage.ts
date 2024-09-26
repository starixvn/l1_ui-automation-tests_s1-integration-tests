import {Locator, Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'

export class PSHomePage extends AbstractPage {
  // Define selectors
  // readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly btnSignIn: Locator
  readonly cbProvider: Locator

  // Init selectors using constructor
  constructor(page: Page) {
    super(page)
    this.btnSignIn = page.locator('text="Sign in"')
    this.usernameInput = page.locator('[placeholder="Username"]')
    this.passwordInput = page.locator('[placeholder="Password"]')
    this.submitButton = page.locator('//div[contains(@class,"AuthFormContainer")]/form/button')
    this.cbProvider = page.locator('//div[@class="p-multiselect-trigger"]')
  }

  
  async visit(url: string) {
    await this.page.goto(url)
  }

  async selectGameType(gametype: string) {
    await this.page.locator(`//div[text()="${gametype}"]`).first().click();
    await this.page.waitForTimeout(2000)
  }

  async selectProvider(providerName: string, timeout: number = 2000) {   
    await this.page.locator(`//span[contains(text(),"${providerName}")]`).focus()
    await this.page.locator(`//span[contains(text(),"${providerName}")]`).click()
    await this.page.waitForLoadState("domcontentloaded")
    await this.page.waitForTimeout(timeout)
  }


}
