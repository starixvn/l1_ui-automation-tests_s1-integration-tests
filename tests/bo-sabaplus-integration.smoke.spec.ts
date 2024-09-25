import { test, expect } from '@playwright/test'
import { BoLoginPage } from '../page-objects/BOLoginPage'
import { PlatformReportPage } from '../page-objects/PlatformReportPage'
import { Navbar } from '../page-objects/components/Navbar'
import { SimulatorPlusPage } from '../page-objects/SimulatorPlusPage'
import { configData } from './configData'

const settlestatus = ['won', 'lose', 'draw'] as const

type SettleStatus = typeof settlestatus[number]

const ticketStatus: Record<SettleStatus, string> = {
  won: 'Win',
  lose: 'Loss',
  draw: 'Draw',

}

test.describe.parallel('Saba Plus Smoke Test', () => {
  let loginPage: BoLoginPage
  let navbar: Navbar
  let platformReportPage: PlatformReportPage
  let simulatorPage: SimulatorPlusPage
  let boPage: any
  let smPage: any

  // Before Hook
  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext()
    boPage = await context.newPage()
    smPage = await context.newPage()
    loginPage = new BoLoginPage(boPage)
    navbar = new Navbar(boPage)
    platformReportPage = new PlatformReportPage(boPage)
    simulatorPage = new SimulatorPlusPage(smPage)
  })

  test(`Verify Open Ticket After User Placing a Bet`, async () => {
    await smPage.bringToFront()
    await smPage.goto(configData.smPlusDomain)
    await simulatorPage.submitUserId(configData.playerCode)
    const {  TicketNo, Stake }=  (await simulatorPage.clickPlacebet()).Payload.BetDataSet[0]
    await simulatorPage.clickSubmit()
    await performBOActions()

    const expectedTicketData = {
      Id: TicketNo,
      betAmount: Stake.toFixed(2),
      status: "Open",
      winloss: "0.00"
    }

    await platformReportPage.verifyTicketDetail(expectedTicketData)

    //EndGame above bet
    await simulatorPage.endGame("won")
  })
  

  for (const status of settlestatus) {
    test(`Verify Place bet then End Game with ${status}`, async () => {
      const settledata = await performSimulatorActions(status)
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.Stake.toFixed(2),
        status: ticketStatus[status],
        winloss: settledata.winloss
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  for (const status of settlestatus) {
    test(`Verify Place Free Spin then End Game with ${status}`, async () => {
      const settledata = await performSimulatorActions(status,"freespin")
      await performBOActions()
      console.log(status,settledata.Stake);
      
      const expectedTicketData = {
        Id: settledata.id,
        betAmount: "0.00",
        status: ticketStatus[status],
        winloss: settledata.winloss
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }


  const performSimulatorActions = async (
    status: SettleStatus, action: string =""
  ) => {
    await smPage.bringToFront()
    await smPage.goto(configData.smPlusDomain)
    await simulatorPage.submitUserId(configData.playerCode)
    
    if (action == "freespin") {
      return await simulatorPage.placebetFreeSpin(status)
    }
    else{
      return await simulatorPage.placebetSettle(status)
    }

  }

  const performBOActions = async () => {
    await boPage.bringToFront()
    await boPage.goto(configData.boDomain)
    await loginPage.login()
    await navbar.clickOnMenuItem(configData.mainMenu)
    await platformReportPage.selectOrderTracking()
    await platformReportPage.filterbyPlatform(configData.platformCode)
    await platformReportPage.filterbyUsername(configData.userName)
  }
})
