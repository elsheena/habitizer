/**
 * CheckinPageController — Habitizer Nightly Check-In Controller.
 * Single Responsibility: Manage nightly check-in choices, auto-promotion modal, and option elements via DOM APIs.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  if (window.Navbar) {
    window.Navbar.render('checkin');
  }

  const habitSelect = document.getElementById('checkin-habit-select');
  const btnClean = document.getElementById('btn-choice-clean');
  const btnRelapse = document.getElementById('btn-choice-relapse');
  const followup = document.getElementById('replacement-followup');
  const customNote = document.getElementById('custom-routine-note');
  const submitBtn = document.getElementById('btn-submit-checkin');
  const form = document.getElementById('checkin-form');

  const promoModal = document.getElementById('promotion-modal');
  const promoRoutineName = document.getElementById('promo-routine-name');
  const promoClose = document.getElementById('promo-modal-close');
  const promoDismiss = document.getElementById('promo-btn-dismiss');
  const promoAccept = document.getElementById('promo-btn-accept');

  let selectedOutcome = null; // 'clean' or 'relapse'

  try {
    const habits = await window.API.getHabits();
    if (habitSelect) {
      habitSelect.innerHTML = '';
      habits.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.bad_habit} (Scheduled ${h.scheduled_time || '09:00'})`;
        habitSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Error loading habits for checkin:", err);
  }

  if (btnClean) {
    btnClean.addEventListener('click', () => {
      selectedOutcome = 'clean';
      btnClean.classList.add('selected-success');
      if (btnRelapse) btnRelapse.classList.remove('selected-relapse');
      if (followup) followup.classList.remove('hidden-control');
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  if (btnRelapse) {
    btnRelapse.addEventListener('click', () => {
      selectedOutcome = 'relapse';
      btnRelapse.classList.add('selected-relapse');
      if (btnClean) btnClean.classList.remove('selected-success');
      if (followup) followup.classList.add('hidden-control');
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedOutcome) return;

      const habitId = habitSelect ? habitSelect.value : "hab_01";
      const didAvoid = selectedOutcome === 'clean';
      const note = customNote ? customNote.value.trim() : '';

      try {
        const res = await window.API.submitDailyCheckin({
          habit_id: habitId,
          did_bad_habit: !didAvoid,
          used_replacement: didAvoid,
          replacement_note: note
        });

        if (didAvoid) {
          if (window.Toast) {
            window.Toast.show(`Check-in recorded! Clean Streak extended to ${res.streak} days (+10 coins)`, 'success');
          }

          if (note.length > 3) {
            setTimeout(() => {
              if (promoModal) {
                if (promoRoutineName) promoRoutineName.textContent = note;
                promoModal.classList.add('open');
              }
            }, 600);
          } else {
            setTimeout(() => window.location.href = '/', 1000);
          }
        } else {
          if (window.Toast) {
            window.Toast.show(`Check-in recorded. Streak Freeze evaluated (${res.freezes} remaining).`, 'warning');
          }
          setTimeout(() => window.location.href = '/', 1200);
        }
      } catch (err) {
        if (window.Toast) window.Toast.show('Error submitting checkin', 'error');
      }
    });
  }

  function closePromoModal() {
    if (promoModal) promoModal.classList.remove('open');
    window.location.href = '/';
  }

  if (promoClose) promoClose.addEventListener('click', closePromoModal);
  if (promoDismiss) promoDismiss.addEventListener('click', closePromoModal);
  if (promoAccept) {
    promoAccept.addEventListener('click', () => {
      if (window.Toast) {
        window.Toast.show('Custom routine successfully promoted into official Habit Loop!', 'success');
      }
      setTimeout(closePromoModal, 800);
    });
  }
});
