/**
 * Habitizer New Habit Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  if (window.Navbar) {
    Navbar.render('create');
  }

  const form = document.getElementById('create-habit-form');
  const badHabitInput = document.getElementById('bad_habit');
  const cueInput = document.getElementById('cue_trigger');
  const routineInput = document.getElementById('replacement_habit');
  const rewardInput = document.getElementById('reward');
  const scheduledTimeInput = document.getElementById('scheduled_time');

  const catHidden = document.getElementById('category-hidden');
  const freqHidden = document.getElementById('frequency-hidden');

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

  // Live input listeners
  [badHabitInput, cueInput, routineInput, rewardInput].forEach(inp => {
    if (inp) inp.addEventListener('input', updateLivePreview);
  });

  // Category Selection Pills
  document.querySelectorAll('#category-pills .selection-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#category-pills .selection-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-val');
      if (catHidden) catHidden.value = val;
    });
  });

  // Frequency Selection Pills
  document.querySelectorAll('#frequency-pills .selection-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#frequency-pills .selection-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-val');
      if (freqHidden) freqHidden.value = val;
    });
  });

  // Quick Routine Chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const routine = chip.getAttribute('data-routine');
      if (routineInput) {
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

      const habitData = {
        bad_habit: badHabitInput.value.trim(),
        cue_trigger: cueInput.value.trim(),
        frequency: freqHidden ? freqHidden.value : 'daily',
        scheduled_time: scheduledTimeInput ? scheduledTimeInput.value : '22:30',
        category: catHidden ? catHidden.value : 'Health & Diet',
        replacement_habit: routineInput.value.trim() || '5-Minute Deep Breathing',
        reward: rewardInput.value.trim() || '10 Shop Coins'
      };

      try {
        const saveBtn = document.getElementById('btn-save-habit');
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving...';
        }

        await window.API.createHabit(habitData);

        if (window.Toast) Toast.show('Habit substitution loop created successfully!', 'success');

        setTimeout(() => {
          window.location.href = '/';
        }, 600);
      } catch (err) {
        if (window.Toast) Toast.show(err.message, 'error');
        const saveBtn = document.getElementById('btn-save-habit');
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Habit Loop';
        }
      }
    });
  }
});
