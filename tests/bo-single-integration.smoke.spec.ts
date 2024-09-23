import { test, expect } from '@playwright/test'
import { BoLoginPage } from '../page-objects/BOLoginPage'
import { PlatformReportPage } from '../page-objects/PlatformReportPage'
import { Navbar } from '../page-objects/components/Navbar'
import { SimulatorPage } from '../page-objects/SimulatorPage'
import { configData } from './configData'
//'void', 'won', 'lose', 'draw', 
const settleStatusVoid = ['void', 'won', 'lose', 'draw', 'half won', 'half lose'] as const
const settlestatus = ['won', 'lose', 'draw', 'half won', 'half lose'] as const

type SettleStatus = typeof settleStatusVoid[number]

const ticketStatus: Record<SettleStatus, string> = {
  void: 'Void',
  won: 'Win',
  lose: 'Loss',
  draw: 'Draw',
  'half won': 'Win',
  'half lose': 'Loss',
}

test.describe.parallel('BO Single Place Bet Tests', () => {
  let loginPage: BoLoginPage
  let navbar: Navbar
  let platformReportPage: PlatformReportPage
  let simulatorPage: SimulatorPage
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
    simulatorPage = new SimulatorPage(smPage)
  })

  for (const status of settleStatusVoid) {
    test(`Verify Place bet then Settle ${status} Ticket`, async () => {
      const settledata = await performSimulatorActions(status)
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.betAmount.toFixed(2),
        status: ticketStatus[status],
        winloss: settledata.winloss
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  for (const status of settlestatus) {
    test(`Verify Resettle Void for ${status} Ticket `, async () => {
      const settledata = await performSimulatorActions(status)
      await simulatorPage.reSettle(settledata, 'void')

      // BO page actions
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.betAmount.toFixed(2),
        validBetAmount: '0.00',
        Turnover: '0.00',
        status: 'Void',
        winloss: '0.00'
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  //Resettle
  for (const status of settlestatus) {
    test(`Verify Resettle for ${status} Ticket `, async () => {
      ['won', 'lose', 'draw', 'half won', 'half lose']
      const newTicketStatus = {
        won: 'lose',
        lose: 'won',
        draw: 'void',
        'half won': 'half lose',
        'half lose': 'half won',
      }
      const settledata = await performSimulatorActions(status)
      const reSettledata = await simulatorPage.reSettle(
        settledata,
        newTicketStatus[status]
      )
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.betAmount.toFixed(2),
        validBetAmount: reSettledata.betAmount,
        Turnover: reSettledata.betAmount,
        status: ticketStatus[newTicketStatus[status]],
        winloss: reSettledata.winloss
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  //Unsettle
  for (const status of settlestatus) {
    test(`Verify Unsettle for ${status} Ticket `, async () => {
      // Simulator page actions
      const settledata = await performSimulatorActions(status)
      await simulatorPage.unSettle()

      // BO page actions
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.betAmount.toFixed(2),
        validBetAmount: '0.00',
        Turnover: '0.00',
        status: 'Open',
        winloss: '0.00'
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  // /Verify Refund 
  for (const status of settlestatus) {
    test(`Verify Refund for ${status} Ticket `, async () => {
      // Simulator page actions
      const settledata = await performSimulatorActions(status)
      await simulatorPage.reSettle(settledata, 'refund')

      // BO page actions
      await performBOActions()

      const expectedTicketData = {
        Id: settledata.id,
        betAmount: settledata.betAmount.toFixed(2),
        validBetAmount: '0.00',
        Turnover: '0.00',
        status: 'Void',
        winloss: '0.00'
      }

      await platformReportPage.verifyTicketDetail(expectedTicketData)
    })
  }

  const performSimulatorActions = async (
    status: SettleStatus
  ) => {
    await smPage.bringToFront()
    await smPage.goto(configData.smDomain)
    await simulatorPage.submitUserId(configData.userID)
    const settledata = await simulatorPage.placebetandSettle(status)
    return settledata
  }

  const performBOActions = async () => {
    await boPage.bringToFront()
    await loginPage.login()
    await navbar.clickOnMenuItem(configData.mainMenu)
    await platformReportPage.selectOrderTracking()
    await platformReportPage.filterbyPlatform(configData.platformCode)
    await platformReportPage.filterbyUsername(configData.userName)
  }
})
