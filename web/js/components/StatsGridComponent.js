/**
 * StatsGridComponent — UI Component for quick metrics cards.
 * Single Responsibility: Build and update Clean Streak, Coin Balance, Freezes, and Success Rate cards.
 */
class StatsGridComponent extends UIComponent {
  /**
   * @param {Object} [data]
   * @param {number} [data.streak=0]
   * @param {number} [data.currency=0]
   * @param {number} [data.freezes=0]
   * @param {string} [data.rate='0%']
   */
  constructor(data = {}) {
    super();
    this.data = {
      streak: data.streak || 0,
      currency: data.currency || 0,
      freezes: data.freezes || 0,
      rate: data.rate || '0%'
    };
    this.element = this._build();
  }

  _build() {
    // 1. Clean streak card
    const streakCard = this._createCard(
      'Active Clean Streak',
      `${this.data.streak} Days`,
      'Consecutive days avoiding bad habits',
      'dash-streak',
      'stat-val-blue'
    );

    // 2. Shop Coins Balance
    const currencyCard = this._createCard(
      'Shop Coins Balance',
      `${this.data.currency} pts`,
      '10 coins earned per clean day',
      'dash-currency',
      'stat-val-amber'
    );

    // 3. Streak Freezes
    const freezesCard = this._createCard(
      'Streak Freezes',
      `${this.data.freezes} Available`,
      'Protects your streak during relapses',
      'dash-freezes',
      'stat-val-blue'
    );

    // 4. Success Rate
    const rateCard = this._createCard(
      'Success Rate',
      this.data.rate,
      '26 replaced / 2 relapses',
      'dash-rate',
      'stat-val-indigo'
    );

    return this.createElement('div', {
      id: 'auth-stats-section',
      className: 'stats-grid',
      children: [streakCard, currencyCard, freezesCard, rateCard]
    });
  }

  _createCard(label, value, subtext, valueId, valueClass) {
    const labelEl = this.createElement('div', { className: 'stat-label', text: label });
    const valEl = this.createElement('div', {
      id: valueId,
      className: ['stat-value', valueClass],
      text: value
    });
    const subEl = this.createElement('div', { className: 'stat-subtext', text: subtext });

    return this.createElement('div', {
      className: 'stat-card',
      children: [labelEl, valEl, subEl]
    });
  }

  /**
   * Update the values in place.
   * @param {Object} data
   */
  update(data) {
    if (data.streak !== undefined) {
      const el = document.getElementById('dash-streak');
      if (el) el.textContent = `${data.streak} Days`;
    }
    if (data.currency !== undefined) {
      const el = document.getElementById('dash-currency');
      if (el) el.textContent = `${data.currency} pts`;
    }
    if (data.freezes !== undefined) {
      const el = document.getElementById('dash-freezes');
      if (el) el.textContent = `${data.freezes} Available`;
    }
    if (data.rate !== undefined) {
      const el = document.getElementById('dash-rate');
      if (el) el.textContent = data.rate;
    }
  }
}

window.StatsGridComponent = StatsGridComponent;
