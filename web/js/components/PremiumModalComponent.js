/**
 * PremiumModalComponent — Plan Comparison & Pro Upgrade Modal.
 * Single Responsibility: Display free vs pro feature comparison and process plan upgrade using DOM APIs.
 */
class PremiumModalComponent extends UIComponent {
  constructor() {
    super();
    this.modalId = 'premium-upgrade-modal';
  }

  open(options = {}) {
    let modal = document.getElementById(this.modalId);
    if (!modal) {
      modal = this._buildModal();
      document.body.appendChild(modal);
    }
    const reasonEl = modal.querySelector('#premium-modal-reason');
    if (reasonEl) {
      reasonEl.textContent = options.reason === 'limit_reached'
        ? "You have reached the Free Plan limit of 3 active habits. Upgrade to Pro for unlimited habits!"
        : "Unlock unlimited habits, 2x coin earnings, and streak freezes.";
      reasonEl.style.display = 'block';
    }
    modal.classList.add('active');
    if (window.Icons) window.Icons.renderAll();
  }

  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('active');
  }

  _buildModal() {
    const overlay = this.createElement('div', { id: this.modalId, className: ['modal-overlay', 'premium-modal-overlay'] });
    const card = this.createElement('div', { className: ['modal-card', 'premium-modal-card'] });
    const closeBtn = this.createElement('button', { className: 'modal-close-btn', text: '×', attrs: { 'aria-label': 'Close' } });
    closeBtn.addEventListener('click', () => this.close());

    const badge = this.createElement('div', { className: ['badge', 'badge-amber', 'premium-pill-badge'], text: 'HABITIZER PRO' });
    const title = this.createElement('h2', { className: 'premium-modal-title', text: 'Upgrade to Habitizer Pro' });
    const reasonText = this.createElement('p', { id: 'premium-modal-reason', className: 'premium-modal-subtext', text: 'Unlock unlimited habits, 2x coin earnings, and streak freezes.' });
    const header = this.createElement('div', { className: 'premium-modal-header', children: [closeBtn, badge, title, reasonText] });

    const grid = this.createElement('div', { className: 'premium-plans-grid' });

    // Free Card
    const freeCard = this.createElement('div', {
      className: ['plan-card', 'plan-card-free'],
      children: [
        this.createElement('div', { className: 'plan-card-header', children: [this.createElement('h3', { className: 'plan-name', text: 'Free Starter' }), this.createElement('div', { className: 'plan-price', text: '$0 / forever' }), this.createElement('p', { className: 'plan-desc', text: 'Essential habit substitution loops.' })] }),
        this.createElement('ul', { className: 'plan-features-list', children: [this.createElement('li', { text: '✓ Max 3 Active Habits' }), this.createElement('li', { text: '✓ Standard Coin Rewards' }), this.createElement('li', { text: '✓ Interactive Calendar' })] }),
        this.createElement('div', { className: 'plan-action-box', children: [this.createElement('span', { className: 'plan-current-indicator', text: 'Current Plan' })] })
      ]
    });

    // Pro Card
    const upgradeBtn = this.createElement('button', { id: 'btn-confirm-upgrade-pro', className: ['btn', 'btn-primary', 'btn-upgrade-pro'], text: 'Upgrade to Pro' });
    upgradeBtn.addEventListener('click', () => this._activateProTier());

    const proCard = this.createElement('div', {
      className: ['plan-card', 'plan-card-pro', 'popular'],
      children: [
        this.createElement('div', { className: 'popular-ribbon', text: 'RECOMMENDED' }),
        this.createElement('div', { className: 'plan-card-header', children: [this.createElement('h3', { className: 'plan-name', text: 'Habitizer Pro' }), this.createElement('div', { className: 'plan-price', text: '$4.99 / month' }), this.createElement('p', { className: 'plan-desc', text: 'Unlimited transformation.' })] }),
        this.createElement('ul', { className: 'plan-features-list', children: [this.createElement('li', { text: '✓ Unlimited Active Habits' }), this.createElement('li', { text: '✓ 2x Daily Coins & Bonuses' }), this.createElement('li', { text: '✓ 3 Free Streak Freezes Monthly' })] }),
        this.createElement('div', { className: 'plan-action-box', children: [upgradeBtn] })
      ]
    });

    grid.appendChild(freeCard);
    grid.appendChild(proCard);

    const footer = this.createElement('div', { className: 'premium-modal-footer', children: [this.createElement('div', { className: 'premium-guarantee', text: 'Risk-free guarantee • Cancel anytime' })] });

    card.appendChild(header);
    card.appendChild(grid);
    card.appendChild(footer);
    overlay.appendChild(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    return overlay;
  }

  async _activateProTier() {
    try {
      const user = window.API ? await window.API.getCurrentUser() : null;
      if (user) {
        user.tier = 'premium';
        if (window.API?.userRepo) window.API.userRepo.updateUser(user);
        localStorage.setItem('habitizer_user', JSON.stringify(user));
      }
      this.close();
      if (window.Toast) window.Toast.show("Welcome to Habitizer Pro!", 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      if (window.Toast) window.Toast.show("Failed to update subscription.", 'error');
    }
  }
}

window.PremiumModalComponent = PremiumModalComponent;
window.PremiumModal = new PremiumModalComponent();
