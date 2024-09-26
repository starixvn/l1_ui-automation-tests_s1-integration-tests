import { test, expect } from '@playwright/test'
import { PSLoginPage } from '../page-objects/PsLoginPage'
import { PSHomePage } from '../page-objects/PsHomePage'
import { configData } from './configData'
//'Sports','Slots','Live Casino', 'Fishing' ,'Lottery','Table Game','Cockfighting','Instant Win'
const gameTypes =  ['Sports','Slots','Live Casino', 'Fishing' ,'Lottery','Table Game','Cockfighting','Instant Win']

test.describe.parallel('BO Single Place Bet Tests', () => {
  let loginPage: PSLoginPage
  let homePage: PSHomePage

  // Before Hook
  test.beforeEach(async ({ page }) => {
    loginPage = new PSLoginPage(page)
    homePage = new PSHomePage(page)
    await homePage.visit(configData.psDomain)
    await loginPage.login(configData.userName,configData.password)
  })

  for (const gametype of gameTypes) {
    test(`Checking game's icon of game type ${gametype}`, async ({ page }) => {
      await homePage.selectGameType(gametype)
      await homePage.cbProvider.click()
      const gameProviderLength = await page.locator("//div[@class='p-multiselect-items-wrapper']//li").count()  
      let lstGameProviders = []
      let lstGamesError = []
      for (let index = 1; index <= gameProviderLength; index++) {
        lstGameProviders.push(await page.locator(`//div[@class='p-multiselect-items-wrapper']//li[${index}]`).innerText());
      }
     
      for (const gamePD of lstGameProviders) {
        await homePage.selectProvider(gamePD)
        const elements = await page.locator('//img[contains(@src,"common/no-image.svg")]/parent::div/parent::div/following::div[1]/div[1]').elementHandles();

        for (const element of elements) {
          const idValue = await element.evaluate(el => el.getAttribute('id') || 'No ID');
          const txt = await element.evaluate(el => el.innerText.trim());
          lstGamesError.push(`Type: ${gametype} -  Provider: ${gamePD} - GameName: ${txt} - ID:${idValue} `)
        }
        await homePage.selectProvider(gamePD)
      }
      await homePage.cbProvider.click()
      if (lstGamesError.length > 0) {
        console.log(`List Games icons error: `,lstGamesError);
      }
    
    })
  }

  
})
