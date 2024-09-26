import { Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'

export const simulatorLocator = {
  inputUserId: `#user-id`,
  btnSave: `text=Save`,
  btnPlaceBet: `//button[text()="Place Bet"]`,
  btnSubmit: `text=Submit`,
  btnEndGame: `//button[text()="End Game"]`,
  btnCancelBet: `//button[text()="Cancel Bet"]`,
  btnRestart: `text=Restart`,
  btnPlaceBetSettle: `//button[text()="Place Bet And Settle"]`,
  btnPlaceFreeSpin: `//button[text()="Place Free Spin"]`,
  tabManual: `text=Manual`,
  tabAuto: `text=Automate`,
  txtRequest: '//textarea[@placeholder="Request Body"]',
  txtResponse: '//textarea[@placeholder="Response"]',
}

export class SimulatorPlusPage extends AbstractPage {
  // Init selectors using constructor
  constructor(page: Page) {
    // this.page = page
    super(page)
  }

  async submitUserId(submitUserId: string) {
    await this.page.locator(simulatorLocator.inputUserId).fill(submitUserId)
    await this.click(simulatorLocator.btnSave)
  }

  async clickPlacebet() {
    await this.click(simulatorLocator.btnPlaceBet)
    return await this.getRequestField()
  }

  async clickPlacebetSettle() {
    await this.click(simulatorLocator.btnPlaceBetSettle)
    return await this.getRequestField()
  }

  async clickPlaceFreeSpin() {
    await this.click(simulatorLocator.btnPlaceFreeSpin)
    return await this.getRequestField()
  }

  async clickRestart() {
    await this.click(simulatorLocator.btnRestart)
  }

  async clickEndGame() {
    await this.click(simulatorLocator.btnEndGame)
  }

  async clickSubmit() {
    await this.click(simulatorLocator.btnSubmit)
  }

  async click(locator: string) {
    await this.page.locator(locator).click()
    await this.page.waitForTimeout(1000)
  }

  async getRequestField(isMessage: boolean = false) {
    await this.page.locator(simulatorLocator.txtRequest).waitFor({ state: 'visible' });
    const data = await this.page
      .locator(simulatorLocator.txtRequest)
      .innerHTML()
    const parsedData = JSON.parse(data)
    return isMessage ? parsedData.Payload : parsedData
  }

  async getResponseField() {
    await this.page.locator(simulatorLocator.txtResponse).waitFor({ state: 'visible' });

    const data = await this.page
      .locator(simulatorLocator.txtResponse)
      .innerHTML()
    return data ? JSON.parse(data) : ''
  }

  async endGame(status: string, GameType:string,odds: number = 0.95) {
    return await this.settleBet(status,GameType, odds, this.clickEndGame.bind(this));
  }

  async placebetSettle(status: string, GameType:string, odds: number = 0.95) {
    return await this.settleBet(status, GameType,odds, this.clickPlacebetSettle.bind(this));
  }

  async placebetFreeSpin(status: string, GameType:string, odds: number = 0.95) {
    await this.clickPlaceFreeSpin()
    await this.clickSubmit()
    await this.clickEndGame()
    const settdata = await this.getRequestField();
    const txn = settdata.Payload.BetDataSet[0];
    const hardcodestake = 30
    switch (status.toLowerCase()) {
      case 'won':
        txn.NetStake = hardcodestake;
        txn.Payout = hardcodestake * (1 + odds);
        break;
      case 'lose':
        txn.Stake = txn.ActualStake =hardcodestake
        txn.Payout = 0;
        break;
      case 'draw':
        txn.Payout = txn.ActualStake = hardcodestake;
        break;
    }
    const winloss= status === "won" ? ((hardcodestake * odds)+hardcodestake).toFixed(2):
    status === "lose" ? -(hardcodestake) : "0.00"; 
    settdata.Payload.GameType = GameType
    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();

    return { id: txn.TicketNo , Stake: hardcodestake, odds, status, winloss:winloss};
  }

  async settleBet(status: string, GameType:string, odds: number, clickMethod: () => Promise<void>) {
    await clickMethod();
    const settdata = await this.getRequestField();
    const txn = settdata.Payload.BetDataSet[0];

      switch (status.toLowerCase()) {
        case 'won':
          txn.NetStake = txn.ActualStake;
          txn.Payout = txn.ActualStake * (1 + odds);
          break;
        case 'lose':
          txn.NetStake = txn.ActualStake;
          txn.Payout = 0;
          break;
        case 'draw':
          txn.Payout = txn.NetStake = txn.ActualStake;
          break;
      }
      const winloss= status === "won" ? (txn.ActualStake * odds).toFixed(2) :
      status === "lose" ? (-parseFloat(txn.ActualStake)).toFixed(2) : "0.00";
      settdata.Payload.GameType = GameType
    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();
    // Return result
    return { id: txn.TicketNo, Stake: txn.Stake, odds, status, winloss };
  }

  
}
