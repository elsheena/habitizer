// Nightly Habit Audit Check-in Page Controller

import { store } from "../state.js";
import { showToast } from "../toast.js";

export function initCheckinPage() {
  populateHabitDropdown();
  setupCheckinForm();

  store.subscribe((eventKey) => {
    if (eventKey === "HABITS_UPDATED" || eventKey === "HABIT_ADDED" || eventKey === "HABIT_REMOVED") {
      populateHabitDropdown();
    }
  });
}

function populateHabitDropdown() {
  const select = document.getElementById("select-checkin-habit");
  if (!select) return;
  select.innerHTML = "";

  store.getState().habits.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = h.bad_habit;
    select.appendChild(opt);
  });
}

function setupCheckinForm() {
  const form = document.getElementById("form-checkin");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const habitId = document.getElementById("select-checkin-habit").value;
    const didBadHabit = document.getElementById("select-did-bad").value === "yes";
    const usedRepl = document.getElementById("select-used-repl").value === "yes";
    const replNote = document.getElementById("input-repl-note").value.trim();

    if (didBadHabit) {
      const state = store.getState();
      if (state.economy.streak_freezes_available > 0) {
        store.updateEconomy(0, -1, 0);
        showToast("Relapse recorded. 1 Streak Freeze was used to preserve your streak!", "info");
      } else {
        store.updateStreak(0);
        showToast("Relapse recorded. No freezes left - streak reset to 0.", "info");
      }
    } else {
      store.updateEconomy(15, 0, 0);
      store.updateStreak(1);
      showToast("Clean day! Earned +15 Currency points.", "success");

      if (usedRepl && replNote !== "") {
        const counts = store.getState().customReplacementCounts;
        counts[replNote] = (counts[replNote] || 0) + 1;
        if (counts[replNote] >= 2) {
          showAutoPromotionBanner(habitId, replNote);
        }
      }
    }

    form.reset();
  });
}

function showAutoPromotionBanner(habitId, replNote) {
  const banner = document.getElementById("promotion-banner");
  if (!banner) return;

  banner.style.display = "flex";
  const textEl = document.getElementById("banner-text");
  if (textEl) {
    textEl.textContent = `You have successfully used '${replNote}' multiple times! Would you like to promote it to your official scheduled replacement routine?`;
  }

  const btnAccept = document.getElementById("btn-accept-promotion");
  if (btnAccept) {
    btnAccept.onclick = () => {
      const habits = store.getState().habits;
      const h = habits.find(item => item.id === habitId);
      if (h) {
        h.replacement_habit = replNote;
        store.setHabits([...habits]);
        showToast(`'${replNote}' is now your official replacement routine!`, "success");
      }
      banner.style.display = "none";
    };
  }
}
