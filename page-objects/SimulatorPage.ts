import { Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'

export const simulatorLocator = {
  inputUserId: `#user-id`,
  btnSave: `text=Save`,
  btnPlaceBet: `//button[text()="Place Bet"]`,
  btnPlaceBetParlay: `//button[text()="Place Bet Parlay"]`,
  btnSubmit: `text=Submit`,
  btnConfirmBet: `//button[text()="Confirm Bet"]`,
  btnCancelBet: `//button[text()="Cancel Bet"]`,
  btnRestart: `text=Restart`,
  btnSettleBet: `//button[text()="Settle Bet"]`,
  btnUnSettleBet: `//button[text()="Unsettle Bet"]`,
  btnReSettleBet: `//button[text()="Resettle Bet"]`,
  tabManual: `text=Manual`,
  tabAuto: `text=Automate`,
  txtRequest: '//div[1][@class="data-box"]/textarea',
  txtResponse: '//div[2][@class="data-box"]/textarea',
}

export class SimulatorPage extends AbstractPage {
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

  async clickPlacebetParlay() {
    await this.click(simulatorLocator.btnPlaceBetParlay)
    return await this.getRequestField()
  }

  async clickConfirmBet() {
    await this.click(simulatorLocator.btnConfirmBet)
  }

  async clickCancelBet() {
    await this.click(simulatorLocator.btnCancelBet)
  }

  async clickRestart() {
    await this.click(simulatorLocator.btnRestart)
  }

  async clickSettle() {
    await this.click(simulatorLocator.btnSettleBet)
  }

  async clickReSettle() {
    await this.click(simulatorLocator.btnReSettleBet)
  }

  async clickUnSettle() {
    await this.click(simulatorLocator.btnUnSettleBet)
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
    return isMessage ? parsedData.message : parsedData
  }

  async getResponseField() {
    await this.page.locator(simulatorLocator.txtResponse).waitFor({ state: 'visible' });

    const data = await this.page
      .locator(simulatorLocator.txtResponse)
      .innerHTML()
    return data ? JSON.parse(data) : ''
  }

  async placebetandSettle(status: string) {
    // Place bet
    const { message: { BetAmount: betAmount, Odds: odds } } = await this.clickPlacebet();
    await this.clickSubmit();
    await this.clickConfirmBet();
  
    // Get transaction ID
    const { TxId } = (await this.getRequestField(true)).Txns[0];
    await this.clickSubmit();
  
    // Settle bet
    await this.clickSettle();
    const settdata = await this.getRequestField();
    const txn = settdata.message.Txns[0];
    const bfPayout = txn.Payout
    // Update transaction based on status
    switch (status.toLowerCase()) {
      case 'lose':
        txn.Payout = txn.CreditAmount = 0;
        break;
      case 'draw':
        txn.Payout = txn.DebitAmount = betAmount;
        txn.CreditAmount = 0;
        break;
      case 'void':
        txn.Payout = txn.CreditAmount = betAmount;
        break;
      case 'half won':
        txn.Payout = bfPayout/2;
        txn.CreditAmount = bfPayout/2;
        txn.DebitAmount = bfPayout/2
        break;
      case 'half lose':
          txn.Payout = bfPayout/2;
          txn.CreditAmount = bfPayout/2;
          txn.DebitAmount = bfPayout/2
          break;      
    }
    txn.Status = status;
    const winloss = status.toLowerCase() === "won" ? (txn.Payout - parseFloat(betAmount)).toFixed(2) : 
    status.toLowerCase() === "lose" ? (-parseFloat(betAmount)).toFixed(2):
    status.toLowerCase() === "half won" ? (-(bfPayout - parseFloat(betAmount))).toFixed(2) :
    status.toLowerCase() === "half lose" ? (-parseFloat(betAmount) / 2).toFixed(2) : "0.00";

    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();
  
    // Return result
    return { id: TxId, betAmount, validAmount: betAmount, odds, status,winloss:winloss };
  }

  async reSettle(betAmount: string,status: string) {
  
    // ReSettle bet
    await this.clickReSettle();
    const settdata = await this.getRequestField();
    const txn = settdata.message.Txns[0];
    const bfPayout = txn.Payout

    // Update transaction based on status
    switch (status.toLowerCase()) {
      case 'lose':
        txn.Payout = txn.CreditAmount = 0;
        break;
      case 'draw':
        txn.Payout = txn.DebitAmount = betAmount;
        txn.CreditAmount = 0;
        break;
      case 'void':
        txn.Payout = txn.CreditAmount = betAmount;
        break;
    }
    txn.Status = status;
    const winloss = status.toLowerCase() === "won" ? (txn.Payout - parseFloat(betAmount)).toFixed(2) : 
    status.toLowerCase() === "lose" ? (-parseFloat(betAmount)).toFixed(2):
    status.toLowerCase() === "half won" ? (-(bfPayout - parseFloat(betAmount))).toFixed(2) :
    status.toLowerCase() === "half lose" ? (-parseFloat(betAmount) / 2).toFixed(2) : "0.00";

    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();
  
    // Return result
    return { id: txn.TxId, betAmount, validAmount: betAmount, status,winloss:winloss };
  }
  
  async unSettle() {
    await this.clickUnSettle();
    await this.clickSubmit();
  }
}
