import { Page } from '@playwright/test'
import { AbstractPage } from './AbstractPage'

export const simulatorLocator = {
  inputUserId: `#user-id`,
  btnSave: `text=Save`,
  btnPlaceBet: `//button[text()="Place Bet"]`,
  btnPlaceBetParlay: `//button[text()="Place Bet Parlay"]`,
  btnSubmit: `text=Submit`,
  btnConfirmBet: `//button[text()="Confirm Bet"]`,
  btnConfirmBetParlay: `//button[text()="Confirm Place Bet Parlay"]`,
  btnCancelBet: `//button[text()="Cancel Bet"]`,
  btnRestart: `text=Restart`,
  btnSettleBet: `//button[text()="Settle Bet"]`,
  btnSettleBetParlay: `//button[text()="Settle Bet Parlay"]`,
  btnUnSettleBet: `//button[text()="Unsettle Bet"]`,
  btnReSettleBet: `//button[text()="Resettle Bet"]`,
  btnUnSettleBetParlay: `//button[text()="Unsettle Bet Parlay"]`,
  btnReSettleBetParlay: `//button[text()="Resettle Bet Parlay"]`,
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

  async clickConfirmBetParlay() {
    await this.click(simulatorLocator.btnConfirmBetParlay)
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

  async clickSettleParlay() {
    await this.click(simulatorLocator.btnSettleBetParlay)
  }

  async clickReSettle() {
    await this.click(simulatorLocator.btnReSettleBet)
  }

  async clickReSettleParlay() {
    await this.click(simulatorLocator.btnReSettleBetParlay)
  }

  async clickUnSettle() {
    await this.click(simulatorLocator.btnUnSettleBet)
  }

  async clickUnSettleParlay() {
    await this.click(simulatorLocator.btnUnSettleBetParlay)
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
    
    // Update transaction based on status
    switch (status.toLowerCase()) {
      case 'lose':
        txn.Payout = txn.CreditAmount = 0;
        txn.DebitAmount = betAmount
        break;
      case 'draw':
        txn.Payout = txn.DebitAmount = betAmount;
        txn.CreditAmount = 0;
        break;
      case 'void':
        txn.Payout = txn.CreditAmount = betAmount;
        break;
      case 'half lose':
          txn.Payout =betAmount/2;
          txn.CreditAmount = 0;
          txn.DebitAmount = betAmount/2
          break;      
    }
    txn.Status = status;
    const winloss = status=== "won" || status === "half won" ? (betAmount*odds).toFixed(2) : 
    status === "lose" ? (-parseFloat(betAmount)).toFixed(2):
    status=== "half lose" ? (-betAmount/2).toFixed(2) : "0.00";

    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();
    // Return result
    return { id: TxId, betAmount, validAmount: betAmount, odds, status,winloss:winloss };
  }

  async placebetandSettleParlay(status: string) {
    // Place bet
    await this.clickPlacebetParlay();
    await this.clickSubmit();
    await this.clickConfirmBetParlay();
  
    // Get transaction ID
    const placebetData  = (await this.getRequestField(true)).Txns;
    const extractedData = placebetData.map(({ TxId, Odds, ActualAmount }) => ({ TxId, Odds, ActualAmount }));

    await this.clickSubmit();
  
    // //Parlay Settle bet
    await this.clickSettleParlay();
    const settdata = await this.getRequestField();
    
    settdata.message.Txns = settdata.message.Txns.map(txn => {
      const matchingTx = extractedData.find(et => et.TxId === txn.TxId);
      
      if (matchingTx) {
        switch (status.toLowerCase()) {
          case 'lose':
            txn.Payout = txn.CreditAmount = 0;
            txn.DebitAmount = matchingTx.ActualAmount;
            break;
          case 'draw':
            txn.Payout = txn.DebitAmount = matchingTx.ActualAmount;
            txn.CreditAmount = 0;
            break;
          case 'void':
            txn.Payout = txn.CreditAmount = matchingTx.ActualAmount;
            txn.DebitAmount = 0;
            break;
          case 'won':
            txn.Payout = txn.CreditAmount = matchingTx.ActualAmount * (1 + matchingTx.Odds);
            txn.DebitAmount = 0;
            break;
          case 'half lose':           
              txn.Payout = matchingTx.ActualAmount/2;
              txn.CreditAmount = 0;
              txn.DebitAmount =  matchingTx.ActualAmount/2
              break;  
        }
        txn.Status = status;
      }
      return txn;
    });
    
    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();
  
    // Return result
    return extractedData.map(et => ({
      id: et.TxId,
      betAmount: et.ActualAmount,
      validAmount: et.ActualAmount,
      odds: et.Odds,
      status: status,
      winloss: status === "won"|| status === "half won" ? (et.ActualAmount * et.Odds).toFixed(2) : 
               status === "lose" ? (-et.ActualAmount).toFixed(2) : 
               status=== "half lose" ? (-et.ActualAmount/2).toFixed(2) :  "0.00"
    }));

  }

  async reSettle(settledata: any,status: string) {
    // ReSettle bet
    await this.clickReSettle();
    const settdata = await this.getRequestField();
    const txn = settdata.message.Txns[0];
    // Update transaction based on status
    switch (status.toLowerCase()) {
      case 'won':
        txn.Payout = txn.CreditAmount = settledata.betAmount + (settledata.betAmount * settledata.odds);
        txn.DebitAmount = 0
        break;
      case 'lose':
        txn.Payout = txn.CreditAmount = 0;
        txn.DebitAmount = settledata.betAmount
        break;
      case 'draw':
        txn.Payout = txn.DebitAmount = settledata.betAmount;
        txn.CreditAmount = 0;
        break;
      case 'void':
        txn.Payout = txn.CreditAmount = settledata.betAmount;
        break;
      case 'half lose':
          txn.Payout =settledata.betAmount/2;
          txn.CreditAmount = 0;
          txn.DebitAmount = settledata.betAmount/2
          break;  
      case 'half won':
        txn.Payout = txn.CreditAmount = settledata.betAmount + (settledata.betAmount * settledata.odds);
        txn.DebitAmount = 0
        break;     
      case 'refund':
        txn.Payout = txn.CreditAmount = settledata.betAmount;
        break;          
    }

    txn.Status = status;
    const winloss = status=== "won" || status === "half won" ? (settledata.betAmount*settledata.odds).toFixed(2) : 
    status === "lose" ? (-parseFloat(settledata.betAmount)).toFixed(2):
    status=== "half lose" ? (-settledata.betAmount/2).toFixed(2) : "0.00";

    await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
    await this.clickSubmit();

    // Return result
    return { id: txn.TxId, betAmount:settledata.betAmount, validAmount:settledata.betAmount, status,winloss:winloss };
  }

  async reSettleParlay(settledata: any,status: string) {
    // ReSettle bet
    const extractedData = settledata.map(({ id, odds, betAmount }) => ({ id, odds, betAmount }));
    
    await this.clickReSettleParlay();
    const settdata = await this.getRequestField();

    settdata.message.Txns = settdata.message.Txns.map(txn => {
    const matchingTx = extractedData.find(et => et.id === txn.TxId);    
    // Update transaction based on status
    if (matchingTx) {
    switch (status.toLowerCase()) {
      case 'won':
        txn.Payout = txn.CreditAmount = matchingTx.betAmount * (1 + matchingTx.odds);;
        txn.DebitAmount = 0
        break;
      case 'lose':
        txn.Payout = txn.CreditAmount = 0;
        txn.DebitAmount = matchingTx.betAmount
        break;
      case 'draw':
        txn.Payout = txn.DebitAmount = matchingTx.betAmount;
        txn.CreditAmount = 0;
        break;
      case 'void':
        txn.Payout = txn.CreditAmount = matchingTx.betAmount;
        break;
      case 'half lose':
          txn.Payout =matchingTx.betAmount/2;
          txn.CreditAmount = 0;
          txn.DebitAmount = matchingTx.betAmount/2
          break;  
      case 'half won':
        txn.Payout = txn.CreditAmount = matchingTx.betAmount + (matchingTx.betAmount * matchingTx.odds);
        txn.DebitAmount = 0
        break;     
      case 'refund':
        txn.Payout = txn.CreditAmount = matchingTx.betAmount;
        break;          
    }
    txn.Status = status;
  }
  return txn;
});

  await this.page.locator(simulatorLocator.txtRequest).fill(JSON.stringify(settdata));
  await this.clickSubmit();

  return settledata.map(et => ({
    id: et.id,
    betAmount: et.betAmount,
    odds: et.odds,
    status: status,
    winloss: status === "won"|| status === "half won" ? (et.betAmount * et.odds).toFixed(2) : 
             status === "lose" ? (-et.betAmount).toFixed(2) : 
             status=== "half lose" ? (-et.betAmount/2).toFixed(2) :  "0.00"
  }));

  }
  
  async unSettle() {
    await this.clickUnSettle();
    await this.clickSubmit();
  }

  async unSettleParlay() {
    await this.clickUnSettleParlay();
    await this.clickSubmit();
  }

}
