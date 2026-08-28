/**
 * ProfilePageController — Profile & Suggested Habits Controller.
 * Single Responsibility: Manage profile ledger, plan badge, and render CatalogCardComponents using DOM APIs.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  if (window.Navbar) {
    window.Navbar.render('profile');
  }

  const nameEl = document.getElementById('prof-name');
  const emailEl = document.getElementById('prof-email');
  const avatarEl = document.getElementById('prof-avatar');
  const idEl = document.getElementById('prof-id');
  const tierBadge = document.getElementById('prof-tier-badge');
  const toggleTierBtn = document.getElementById('btn-toggle-tier-prof');

  const longestStreakEl = document.getElementById('prof-longest-streak');
  const subsEl = document.getElementById('prof-substitutions');
  const relapsesEl = document.getElementById('prof-relapses');
  const rateDisplay = document.getElementById('prof-rate-display');
  const progressBar = document.getElementById('prof-progress-bar');

  const calBadge = document.getElementById('cal-sync-badge');
  const toggleCalBtn = document.getElementById('btn-toggle-cal-sync');

  const suggestedGrid = document.getElementById('suggested-habits-grid');
  const filterBtns = document.querySelectorAll('#suggested-filters .filter-btn');

  let fullCatalog = [];
  let activeCategory = 'all';

  async function updateProfile() {
    try {
      const user = await window.API.getCurrentUser();
      const streaks = await window.API.getStreaks();

      const firstName = (user.full_name || 'Alex').split(' ')[0];
      const headingEl = document.getElementById('profile-heading') || document.querySelector('.page-header h1');
      if (headingEl) headingEl.textContent = `Welcome, ${firstName}`;

      if (avatarEl) avatarEl.textContent = firstName.charAt(0).toUpperCase();
      if (idEl) idEl.textContent = user.id || 'usr_demo_88';

      if (nameEl) nameEl.textContent = user.full_name;
      if (emailEl) emailEl.textContent = user.email;
      const habits = await window.API.getHabits();
      const activeCount = habits ? habits.filter(h => h.is_active !== false).length : 0;
      const isPro = user.tier === 'premium' || user.plan === 'pro';

      if (tierBadge) {
        tierBadge.textContent = isPro ? '★ Habitizer Pro (Unlimited)' : 'Free Starter (3 Habits)';
        tierBadge.className = `tier-badge ${isPro ? 'tier-premium' : 'tier-free'}`;
      }

      const habitLimitDisplay = document.getElementById('prof-habit-limit-display');
      if (habitLimitDisplay) {
        habitLimitDisplay.textContent = isPro ? `${activeCount} Active (Unlimited Pro)` : `${activeCount} / 3 (Free Cap)`;
      }

      const openModalBtn = document.getElementById('btn-open-premium-modal');
      if (openModalBtn) {
        openModalBtn.textContent = isPro ? '★ Manage Pro Membership' : '⚡ Compare Plans & Upgrade';
        openModalBtn.onclick = () => {
          if (window.PremiumModal) window.PremiumModal.open();
        };
      }

      if (longestStreakEl) longestStreakEl.textContent = `${streaks.longest_streak} Days`;
      if (subsEl) subsEl.textContent = `${streaks.total_substitutions} Total`;
      if (relapsesEl) relapsesEl.textContent = `${streaks.total_relapses} Total`;
      if (rateDisplay) rateDisplay.textContent = `${streaks.success_rate}`;
      if (progressBar) progressBar.style.width = streaks.success_rate;

      const isMock = user.id === 'usr_demo_88' || Boolean(user.is_mock);
      if (toggleTierBtn) toggleTierBtn.classList.toggle('hidden-control', !isMock);
      const calSyncCard = document.getElementById('cal-sync-card');
      if (calSyncCard) calSyncCard.classList.toggle('hidden-section', !isMock);

      fullCatalog = await window.API.getCatalog();
      renderSuggestedHabits();
    } catch (err) {
      console.error("Profile error:", err);
    }
  }

  function renderSuggestedHabits() {
    if (!suggestedGrid) return;
    suggestedGrid.innerHTML = '';

    const filtered = activeCategory === 'all'
      ? fullCatalog
      : fullCatalog.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

    filtered.forEach(item => {
      const cardComp = new CatalogCardComponent(item, {
        onAdopt: (selectedItem) => {
          if (window.Toast) {
            window.Toast.show(`Selected "${selectedItem.title}". Opening Habit Builder...`, 'success');
          }
          setTimeout(() => {
            window.location.href = `/create`;
          }, 500);
        }
      });
      suggestedGrid.appendChild(cardComp.element);
    });

    if (window.Icons) window.Icons.renderAll();
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-cat');
      renderSuggestedHabits();
    });
  });

  await updateProfile();

  if (toggleTierBtn) {
    toggleTierBtn.addEventListener('click', async () => {
      const updated = await window.API.toggleTier();
      await updateProfile();
      if (window.Navbar) window.Navbar.render('profile');
      if (window.Toast) window.Toast.show(`Switched to ${updated.tier.toUpperCase()} tier`, 'success');
    });
  }

  if (toggleCalBtn) {
    toggleCalBtn.addEventListener('click', async () => {
      const isSynced = calBadge ? calBadge.textContent.includes('Connected') : false;
      const nextState = !isSynced;
      if (calBadge) {
        calBadge.textContent = nextState ? 'Connected' : 'Disconnected';
        calBadge.className = `badge ${nextState ? 'badge-success' : 'badge-gray'}`;
      }
      if (window.Toast) window.Toast.show(`Google Calendar ${nextState ? 'connected' : 'disconnected'}`, 'info');
    });
  }
});
