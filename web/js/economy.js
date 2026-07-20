/**
 * Habitizer Economy & Rewards Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Sidebar) {
    Sidebar.render('economy');
  }

  const balanceEl = document.getElementById('econ-balance');
  const freezesEl = document.getElementById('econ-freezes');
  const screenTimeEl = document.getElementById('econ-screentime');

  const passModal = document.getElementById('pass-modal');
  const passCodeDisplay = document.getElementById('pass-code-display');
  const passModalClose = document.getElementById('pass-modal-close');

  async function updateDisplay() {
    try {
      const econ = await window.API.getEconomy();
      if (balanceEl) balanceEl.textContent = econ.currency_balance;
      if (freezesEl) freezesEl.textContent = `${econ.streak_freezes_available} Available`;
      if (screenTimeEl) screenTimeEl.textContent = `${econ.total_screen_time_earned_mins} Mins`;
    } catch (err) {
      console.error("Economy error:", err);
    }
  }

  await updateDisplay();

  // Buy single freeze
  document.querySelectorAll('.btn-buy-freeze').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await window.API.buyStreakFreeze();
        await updateDisplay();
        if (window.Toast) Toast.show('Purchased 1x Streak Freeze (-50 coins)', 'success');
      } catch (err) {
        if (window.Toast) Toast.show(err.message, 'error');
      }
    });
  });

  // Buy bundle (3x freezes for 120 pts)
  document.querySelectorAll('.btn-buy-bundle').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        // Buy 3 by simulating
        const state = JSON.parse(localStorage.getItem('habitizer_state'));
        if (state.economy.currency_balance < 120) {
          throw new Error('Insufficient coins. You need 120 pts for the 3x bundle.');
        }
        state.economy.currency_balance -= 120;
        state.economy.streak_freezes_available += 3;
        localStorage.setItem('habitizer_state', JSON.stringify(state));

        await updateDisplay();
        if (window.Toast) Toast.show('Purchased 3x Streak Freeze Bundle (-120 coins)', 'success');
      } catch (err) {
        if (window.Toast) Toast.show(err.message, 'error');
      }
    });
  });

  // Redeem screen time passes
  document.querySelectorAll('.btn-redeem-pass').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const mins = parseInt(e.currentTarget.getAttribute('data-mins'), 10) || 30;
      try {
        const res = await window.API.redeemScreenTime(mins);
        await updateDisplay();
        if (passCodeDisplay) passCodeDisplay.textContent = res.passCode;
        if (passModal) passModal.style.display = 'flex';
      } catch (err) {
        if (window.Toast) Toast.show(err.message, 'error');
      }
    });
  });

  if (passModalClose) {
    passModalClose.addEventListener('click', () => {
      if (passModal) passModal.style.display = 'none';
    });
  }
});
