import {Locator, Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'
export class BoLoginPage extends AbstractPage {
  // Define selectors
  // readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  // Init selectors using constructor
  constructor(page: Page) {
    // this.page = page
    super(page)
    this.usernameInput = page.locator('[placeholder="Username"]')
    this.passwordInput = page.locator('[placeholder="Password"]')
    this.submitButton = page.locator('button:has-text("Login")')
  }

  // Define login page methods
  async login(username: string = 'superadmin', password: string= '1234aaAA') {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
    await this.page.waitForTimeout(1000)
  }


}
