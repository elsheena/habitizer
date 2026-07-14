// Habit Creation Page Controller (Freemium Tier Enforcer)

import { store } from "../state.js";
import { ApiClient } from "../api.js";
import { Router } from "../router.js";
import { showToast } from "../toast.js";

export function initCreateHabitPage() {
  const form = document.getElementById("form-create-habit");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const state = store.getState();
    if (state.userTier === "free" && state.habits.length >= 3) {
      showUpgradeModal();
      return;
    }

    const badHabit = document.getElementById("input-bad-habit").value.trim();
    const frequency = document.getElementById("input-frequency").value;
    const scheduledTime = document.getElementById("input-scheduled-time").value || "09:00";
    const trigger = document.getElementById("input-trigger").value.trim();
    const replacement = document.getElementById("input-replacement").value.trim();
    const reward = document.getElementById("input-reward").value.trim();
    const category = document.getElementById("input-category").value;

    const newHabit = {
      id: "hbt_" + Date.now(),
      bad_habit: badHabit,
      frequency: frequency,
      scheduled_time: scheduledTime,
      cue_trigger: trigger,
      replacement_habit: replacement,
      reward: reward,
      category: category
    };

    await ApiClient.createHabit({
      user_id: "usr_demo",
      user_tier: state.userTier,
      bad_habit: badHabit,
      frequency: frequency,
      scheduled_time: scheduledTime,
      cue_trigger: trigger,
      replacement_habit: replacement,
      reward: reward,
      category: category
    });

    store.addHabit(newHabit);
    showToast("New habit substitution mapped successfully!", "success");
    form.reset();

    Router.navigate("calendar");
  });

  setupUpgradeModal();
}

function setupUpgradeModal() {
  const closeBtn = document.getElementById("btn-close-upgrade-modal");
  if (closeBtn) closeBtn.addEventListener("click", closeUpgradeModal);

  const upgradeBtn = document.getElementById("btn-upgrade-now");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      store.setUserTier("premium");
      closeUpgradeModal();
      showToast("Upgraded to Premium Tier! Unlimited habit creation unlocked.", "success");
    });
  }
}

export function showUpgradeModal() {
  const modal = document.getElementById("upgrade-modal");
  if (modal) modal.style.display = "flex";
}

export function closeUpgradeModal() {
  const modal = document.getElementById("upgrade-modal");
  if (modal) modal.style.display = "none";
}

window.closeUpgradeModal = closeUpgradeModal;
