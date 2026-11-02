// src/engine/economy.js - Economy simulation and ledger management for 1957 Hong Kong

export class Economy {
  constructor(initialState = {}) {
    this.cash = Number(initialState.cash ?? 6.0);
    this.staples = Number(initialState.staples ?? 30);
    this.reputation = Number(initialState.reputation ?? 50); // 0-100
    this.day = Number(initialState.day ?? 1);
    this.rentDueDays = [6, 12];
    this.rentAmount = 12.0;
    this.dailyRiceCost = 1.0;
    this.dailyMedicineCost = 0.5;
    this.staplePackCost = 2.0;
    this.staplePackCount = 15;
    this.ledger = Array.isArray(initialState.ledger) ? [...initialState.ledger] : [];

    this._sanitize();
  }

  _sanitize() {
    if (isNaN(this.cash)) this.cash = 6.0;
    if (isNaN(this.staples)) this.staples = 30;
    if (isNaN(this.reputation)) this.reputation = 50;
    if (isNaN(this.day)) this.day = 1;
    this.cash = Math.round(this.cash * 100) / 100;
  }

  /**
   * Records a job settlement
   */
  recordJobEarnings(priceCharged, evaluation, isFree = false) {
    this._sanitize();
    let earned = 0;
    let tip = 0;
    let repDelta = 0;

    if (isFree) {
      earned = 0;
      repDelta = +12; // big reputation boost for charity
    } else {
      const basePrice = Number(priceCharged) || 0;
      if (evaluation.rating === 'perfect') {
        tip = Math.round(basePrice * 0.25 * 10) / 10; // 25% tip for master work
        earned = basePrice + tip;
        repDelta = +8;
      } else if (evaluation.rating === 'good') {
        earned = basePrice;
        repDelta = +4;
      } else {
        // Leaky / poor quality: customer only pays half
        earned = Math.round(basePrice * 0.5 * 10) / 10;
        repDelta = -10;
      }
    }

    this.cash += earned;
    this.reputation = Math.max(0, Math.min(100, this.reputation + repDelta));

    this.ledger.push({
      day: this.day,
      type: 'income',
      description: `修瓷收入${tip > 0 ? `（含街坊打賞 $${tip.toFixed(1)}）` : ''}`,
      amount: earned,
      balance: this.cash
    });

    this._sanitize();
    return { earned, tip, repDelta };
  }

  /**
   * Complete daily settlement on handback: records income, daily living expense, and rent (if due)
   * Ensures the printed settlement rows exactly sum to the final balance.
   */
  recordDailySettlement(priceCharged, evaluation, isFree = false) {
    this._sanitize();
    const earningsRes = this.recordJobEarnings(priceCharged, evaluation, isFree);
    const dailyLiving = this.dailyRiceCost + this.dailyMedicineCost;

    let rentDue = this.rentDueDays.includes(this.day);
    let rentPaid = false;
    let rentPenalty = false;
    let rentCost = 0;

    this.cash -= dailyLiving;
    this.ledger.push({
      day: this.day,
      type: 'expense',
      description: '每日米糧與跌打眼藥草茶',
      amount: -dailyLiving,
      balance: Math.round(this.cash * 100) / 100
    });

    if (rentDue) {
      if (this.cash >= this.rentAmount) {
        this.cash -= this.rentAmount;
        rentPaid = true;
        rentCost = this.rentAmount;
        this.ledger.push({
          day: this.day,
          type: 'rent',
          description: '廟街地攤本週牌照與地租',
          amount: -this.rentAmount,
          balance: Math.round(this.cash * 100) / 100
        });
      } else {
        rentPenalty = true;
        this.reputation = Math.max(0, this.reputation - 20);
        this.ledger.push({
          day: this.day,
          type: 'debt',
          description: '拖欠包租公本週地租（遭催逼）',
          amount: 0,
          balance: Math.round(this.cash * 100) / 100
        });
      }
    }

    this._sanitize();

    return {
      earned: earningsRes.earned,
      tip: earningsRes.tip,
      dailyCost: dailyLiving,
      rentDue,
      rentPaid,
      rentPenalty,
      rentCost,
      newBalance: this.cash
    };
  }

  /**
   * Consumes staples for repair
   */
  consumeStaples(count) {
    this._sanitize();
    const needed = Math.max(0, Number(count) || 0);
    this.staples = Math.max(0, this.staples - needed);

    // Auto-restock if out of staples
    let restockCost = 0;
    if (this.staples <= 2) {
      this.staples += this.staplePackCount;
      this.cash -= this.staplePackCost;
      restockCost = this.staplePackCost;
      this.ledger.push({
        day: this.day,
        type: 'expense',
        description: '上海街添置佛山黃銅絲一打',
        amount: -this.staplePackCost,
        balance: this.cash
      });
    }

    this._sanitize();
    return { remaining: this.staples, restockCost };
  }

  /**
   * Deducts end-of-day subsistence expenses if not already settled
   */
  endDay() {
    this._sanitize();
    this.day += 1;
    this._sanitize();

    return {
      cash: this.cash,
      reputation: this.reputation,
      day: this.day
    };
  }

  canAffordRent() {
    return this.cash >= this.rentAmount;
  }

  toJSON() {
    return {
      cash: this.cash,
      staples: this.staples,
      reputation: this.reputation,
      day: this.day,
      ledger: this.ledger
    };
  }
}
