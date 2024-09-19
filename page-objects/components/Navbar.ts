import { Locator, Page } from '@playwright/test'

export class Navbar {
  readonly page: Page


  constructor(page: Page) {
    this.page = page

  }


  async clickOnMenuItem(menu: string) {
    await this.page.locator(`//span[text()="${menu}"]`).click()
  }

}
