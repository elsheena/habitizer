/**
 * Habitizer New Habit Controller
 * Single Responsibility: Wire form controls, time window pills, and dynamic suggestions catalog.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) return;
  if (window.Navbar) Navbar.render('create');

  const form = document.getElementById('create-habit-form');
  const badHabitInput = document.getElementById('bad_habit');
  const cueInput = document.getElementById('cue_trigger');
  const routineInput = document.getElementById('replacement_habit');
  const rewardInput = document.getElementById('reward');
  const scheduledTimeInput = document.getElementById('scheduled_time');
  const catHidden = document.getElementById('category-hidden');
  const freqHidden = document.getElementById('frequency-hidden');
  const winStartHidden = document.getElementById('window-start-hidden');
  const winEndHidden = document.getElementById('window-end-hidden');

  const urlParams = new URLSearchParams(window.location.search);
  const paramTime = urlParams.get('time');
  if (paramTime && scheduledTimeInput) scheduledTimeInput.value = paramTime;

  // Preview elements
  const prevCue = document.getElementById('prev-cue');
  const prevBad = document.getElementById('prev-bad');
  const prevRoutine = document.getElementById('prev-routine');
  const prevReward = document.getElementById('prev-reward');

  function updateLivePreview() {
    if (prevBad) prevBad.textContent = badHabitInput.value.trim() || 'Specify unwanted habit...';
    if (prevCue) prevCue.textContent = cueInput.value.trim() || 'Specify trigger...';
    if (prevRoutine) prevRoutine.textContent = routineInput.value.trim() || '5-Minute Deep Breathing';
    if (prevReward) prevReward.textContent = rewardInput.value.trim() || '10 Shop Coins';
  }

  [badHabitInput, cueInput, routineInput, rewardInput].forEach(inp => {
    if (inp) inp.addEventListener('input', updateLivePreview);
  });

  // Category & Frequency Pills
  document.querySelectorAll('#category-pills .selection-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#category-pills .selection-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (catHidden) catHidden.value = btn.getAttribute('data-val');
    });
  });

  document.querySelectorAll('#frequency-pills .selection-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#frequency-pills .selection-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (freqHidden) freqHidden.value = btn.getAttribute('data-val');
    });
  });

  // Time Window Pills
  document.querySelectorAll('#time-window-pills .selection-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#time-window-pills .selection-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (winStartHidden) winStartHidden.value = btn.getAttribute('data-start') || '18:00';
      if (winEndHidden) winEndHidden.value = btn.getAttribute('data-end') || '22:00';
    });
  });

  // Dynamic Suggestions Catalog Integration
  try {
    const catalog = window.API?.getCatalog ? await window.API.getCatalog() : [];
    const chipsWrap = document.querySelector('.quick-chips-wrap');
    if (chipsWrap && catalog.length > 0) {
      chipsWrap.textContent = '';
      catalog.forEach(item => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-chip';
        chip.textContent = item.title;
        chip.setAttribute('data-routine', item.title);
        chip.addEventListener('click', () => {
          if (routineInput) {
            routineInput.value = item.title;
            updateLivePreview();
            if (window.Toast) Toast.show(`Selected routine: "${item.title}"`, 'info');
          }
        });
        chipsWrap.appendChild(chip);
      });
    }
  } catch (e) {
    console.warn("Catalog fetch notice:", e);
  }

  // Quick Routine Chips Listener for pre-existing chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const routine = chip.getAttribute('data-routine');
      if (routineInput && routine) {
        routineInput.value = routine;
        updateLivePreview();
        if (window.Toast) Toast.show(`Selected routine: "${routine}"`, 'info');
      }
    });
  });

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const user = window.API ? await window.API.getCurrentUser() : null;
        const habits = window.API ? await window.API.getHabits() : [];
        const isPro = user && (user.tier === 'premium' || user.plan === 'pro');
        const activeCount = habits ? habits.filter(h => h.is_active !== false).length : 0;

        if (!isPro && activeCount >= 3) {
          if (window.PremiumModal) window.PremiumModal.open({ reason: 'limit_reached' });
          else if (window.Toast) window.Toast.show("Free Tier limit reached (max 3 habits). Upgrade for unlimited.", 'warning');
          return;
        }
      } catch (err) {
        console.warn("Limit check notice:", err);
      }

      const habitData = {
        bad_habit: badHabitInput.value.trim(),
        cue_trigger: cueInput.value.trim(),
        frequency: freqHidden ? freqHidden.value : 'daily',
        scheduled_time: scheduledTimeInput ? scheduledTimeInput.value : '22:30',
        category: catHidden ? catHidden.value : 'Health & Diet',
        replacement_habit: routineInput.value.trim() || '5-Minute Deep Breathing',
        reward: rewardInput.value.trim() || '10 Shop Coins',
        preferred_window_start: winStartHidden ? winStartHidden.value : '18:00',
        preferred_window_end: winEndHidden ? winEndHidden.value : '22:00'
      };

      try {
        const saveBtn = document.getElementById('btn-save-habit');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
        await window.API.createHabit(habitData);
        if (window.Toast) Toast.show('Habit substitution loop created successfully!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 500);
      } catch (err) {
        if (window.Toast) Toast.show(err.message || 'Failed to save habit', 'error');
        const saveBtn = document.getElementById('btn-save-habit');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Habit Loop'; }
      }
    });
  }
});

