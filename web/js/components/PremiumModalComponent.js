/**
 * PremiumModalComponent — Interactive Plan Comparison & Subscription Modal.
 * Single Responsibility: Present plan comparison matrix (Free vs Pro) and manage upgrade state.
 */
class PremiumModalComponent extends UIComponent {
  constructor() {
    super();
    this.modalId = 'premium-upgrade-modal';
  }

  /**
   * Open the Premium subscription comparison modal.
   * @param {Object} [options]
   * @param {string} [options.reason] E.g. 'limit_reached' or 'manual'
   */
  open(options = {}) {
    let modal = document.getElementById(this.modalId);
    if (!modal) {
      modal = this._buildModal();
      document.body.appendChild(modal);
    }

    const reasonEl = modal.querySelector('#premium-modal-reason');
    if (reasonEl) {
      if (options.reason === 'limit_reached') {
        reasonEl.textContent = "You have reached the Free Tier limit of 3 active habits. Upgrade to Habitizer Pro for unlimited habits!";
        reasonEl.style.display = 'block';
      } else {
        reasonEl.textContent = "Unlock unlimited habits, 2x coin earnings, free streak freezes, and advanced neural loop analytics.";
        reasonEl.style.display = 'block';
      }
    }

    modal.classList.add('active');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Close the subscription modal.
   */
  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Build the modal DOM structure.
   * @private
   */
  _buildModal() {
    const overlay = this.createElement('div', {
      id: this.modalId,
      className: ['modal-overlay', 'premium-modal-overlay']
    });

    const card = this.createElement('div', {
      className: ['modal-card', 'premium-modal-card']
    });

    // Close button
    const closeBtn = this.createElement('button', {
      className: 'modal-close-btn',
      html: '&times;',
      attributes: { 'aria-label': 'Close' }
    });
    closeBtn.addEventListener('click', () => this.close());

    // Header
    const badge = this.createElement('div', {
      className: ['badge', 'badge-amber', 'premium-pill-badge'],
      text: 'HABITIZER PRO'
    });
    const title = this.createElement('h2', {
      className: 'premium-modal-title',
      text: 'Supercharge Your Habit Mastery'
    });
    const reasonText = this.createElement('p', {
      id: 'premium-modal-reason',
      className: 'premium-modal-subtext',
      text: 'Unlock unlimited habits, 2x coin earnings, free streak freezes, and advanced neural loop analytics.'
    });

    const header = this.createElement('div', {
      className: 'premium-modal-header',
      children: [closeBtn, badge, title, reasonText]
    });

    // Comparison Grid
    const comparisonGrid = this._buildComparisonGrid();

    // Actions Footer
    const footer = this._buildFooter();

    card.appendChild(header);
    card.appendChild(comparisonGrid);
    card.appendChild(footer);
    overlay.appendChild(card);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    return overlay;
  }

  _buildComparisonGrid() {
    const grid = this.createElement('div', { className: 'premium-plans-grid' });

    // Free Tier Card
    const freeCard = this.createElement('div', { className: ['plan-card', 'plan-card-free'] });
    freeCard.innerHTML = `
      <div class="plan-card-header">
        <h3 class="plan-name">Free Starter</h3>
        <div class="plan-price">$0 <span>/ forever</span></div>
        <p class="plan-desc">Essential tools for breaking a core bad habit.</p>
      </div>
      <ul class="plan-features-list">
        <li><span class="feat-icon feat-check">✓</span> <strong>Max 3</strong> Active Habits</li>
        <li><span class="feat-icon feat-check">✓</span> Standard Coin Rewards (10 / day)</li>
        <li><span class="feat-icon feat-check">✓</span> Basic Calendar View</li>
        <li><span class="feat-icon feat-check">✓</span> Standard 21:00 Nightly Check-In</li>
        <li class="feat-disabled"><span class="feat-icon feat-cross">✗</span> Monthly Free Streak Freezes</li>
        <li class="feat-disabled"><span class="feat-icon feat-cross">✗</span> Advanced Neural Rewiring Graphs</li>
      </ul>
      <div class="plan-action-box">
        <span class="plan-current-indicator">Current Base Plan</span>
      </div>
    `;

    // Pro Tier Card
    const proCard = this.createElement('div', { className: ['plan-card', 'plan-card-pro', 'popular'] });
    proCard.innerHTML = `
      <div class="popular-ribbon">RECOMMENDED</div>
      <div class="plan-card-header">
        <h3 class="plan-name">Habitizer Pro</h3>
        <div class="plan-price">$4.99 <span>/ month</span></div>
        <p class="plan-desc">Full access to limitless behavioral transformation.</p>
      </div>
      <ul class="plan-features-list">
        <li><span class="feat-icon feat-check-pro">✓</span> <strong>Unlimited</strong> Active Habits</li>
        <li><span class="feat-icon feat-check-pro">✓</span> <strong>2x Daily Coins</strong> (20 coins + streak bonus)</li>
        <li><span class="feat-icon feat-check-pro">✓</span> <strong>3 Free Streak Freezes</strong> Every Month</li>
        <li><span class="feat-icon feat-check-pro">✓</span> Advanced Behavioral & Neural Loop Visuals</li>
        <li><span class="feat-icon feat-check-pro">✓</span> Smart Adaptive Nightly Check-Ins</li>
        <li><span class="feat-icon feat-check-pro">✓</span> <strong>Pro Member Badge</strong> & Custom Color Accents</li>
      </ul>
      <div class="plan-action-box">
        <button type="button" class="btn btn-primary btn-upgrade-pro" id="btn-confirm-upgrade-pro">
          Upgrade to Habitizer Pro
        </button>
      </div>
    `;

    const upgradeBtn = proCard.querySelector('#btn-confirm-upgrade-pro');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        this._activateProTier();
      });
    }

    grid.appendChild(freeCard);
    grid.appendChild(proCard);
    return grid;
  }

  _buildFooter() {
    const footer = this.createElement('div', { className: 'premium-modal-footer' });
    footer.innerHTML = `
      <div class="premium-guarantee">
        <span>🔒 100% Risk-Free Guarantee • Cancel anytime with a single click</span>
      </div>
    `;
    return footer;
  }

  /**
   * Handle activating Pro Tier in state and UI.
   * @private
   */
  async _activateProTier() {
    try {
      const user = window.API ? await window.API.getCurrentUser() : null;
      if (user) {
        user.tier = 'premium';
        user.plan = 'pro';
        if (window.API && window.API.userRepo) {
          window.API.userRepo.updateUser(user);
        }
        localStorage.setItem('habitizer_user', JSON.stringify(user));
      }

      // Add 3 free streak freezes and 100 bonus coins in state
      if (window.API && window.API.stateRepo && user) {
        const state = window.API.stateRepo.getUserState(user.id);
        if (state) {
          if (!state.economy) state.economy = { currency_balance: 150, streak_freezes_available: 2 };
          state.economy.streak_freezes_available = (state.economy.streak_freezes_available || 0) + 3;
          state.economy.currency_balance = (state.economy.currency_balance || 0) + 100;
          window.API.stateRepo.saveUserState(user.id, state);
        }
      }

      this.close();

      if (window.Toast) {
        window.Toast.show("🎉 Welcome to Habitizer Pro! Unlimited habits and 3 Streak Freezes unlocked.", 'success');
      }

      // Re-render UI components if on profile or create page
      setTimeout(() => {
        window.location.reload();
      }, 750);
    } catch (err) {
      console.error("Error activating Pro tier:", err);
      if (window.Toast) window.Toast.show("Failed to update subscription.", 'error');
    }
  }
}

window.PremiumModalComponent = PremiumModalComponent;
window.PremiumModal = new PremiumModalComponent();
