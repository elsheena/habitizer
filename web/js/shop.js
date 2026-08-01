/**
 * Habitizer Shop Controller
 * Single Responsibility: Manage Shop rewards, purchases, redemptions, and category filtering.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  if (window.Navbar) {
    window.Navbar.render('shop');
  }

  const balanceEl = document.getElementById('econ-balance');
  const freezesEl = document.getElementById('econ-freezes');
  const screenTimeEl = document.getElementById('econ-screentime');

  const passModal = document.getElementById('pass-modal');
  const passCodeDisplay = document.getElementById('pass-code-display');
  const passModalClose = document.getElementById('pass-modal-close');
  const copyPassBtn = document.getElementById('btn-copy-pass');

  async function updateDisplay() {
    try {
      const econ = await window.API.getEconomy();
      if (balanceEl) balanceEl.textContent = econ.currency_balance;
      if (freezesEl) freezesEl.textContent = `${econ.streak_freezes_available} Available`;
      if (screenTimeEl) screenTimeEl.textContent = `${econ.total_screen_time_earned_mins} Mins`;
    } catch (err) {
      console.error("Shop error:", err);
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

  // Buy 3-pack bundle
  document.querySelectorAll('.btn-buy-bundle').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await window.API.buyBundle();
        await updateDisplay();
        if (window.Toast) Toast.show('Purchased 3x Streak Freeze Pack (-120 coins)', 'success');
      } catch (err) {
        if (window.Toast) Toast.show(err.message, 'error');
      }
    });
  });

  // Redeem passes
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

  // Category Filter Tabs
  const filterBtns = document.querySelectorAll('.shop-filter-btn');
  const items = document.querySelectorAll('.shop-item-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.getAttribute('data-category');
      items.forEach(card => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  if (copyPassBtn && passCodeDisplay) {
    copyPassBtn.addEventListener('click', () => {
      const code = passCodeDisplay.textContent.trim();
      navigator.clipboard.writeText(code).then(() => {
        if (window.Toast) Toast.show(`Code ${code} copied to clipboard!`, 'success');
      }).catch(() => {
        if (window.Toast) Toast.show('Code copied!', 'success');
      });
    });
  }

  if (passModalClose) {
    passModalClose.addEventListener('click', () => {
      if (passModal) passModal.style.display = 'none';
    });
  }
});
