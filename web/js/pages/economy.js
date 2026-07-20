// In-App Economy & Reward Store Page Controller

import { store } from "../state.js";
import { showToast } from "../toast.js";

export function initEconomyPage() {
  renderEconomy();
  setupStoreActions();

  store.subscribe((eventKey) => {
    if (eventKey === "ECONOMY_UPDATED" || eventKey === "STREAK_UPDATED") {
      renderEconomy();
    }
  });
}

export function renderEconomy() {
  const eco = store.getState().economy;
  const streak = store.getState().streaks;

  // Stat Grid
  const currencyStat = document.getElementById("stat-currency");
  if (currencyStat) currencyStat.textContent = `${eco.currency_balance} pts`;

  const freezesStat = document.getElementById("stat-freezes");
  if (freezesStat) freezesStat.textContent = `${eco.streak_freezes_available} Left`;

  const screentimeStat = document.getElementById("stat-screentime");
  if (screentimeStat) screentimeStat.textContent = `${eco.total_screen_time_earned_mins} Mins`;

  const streakStat = document.getElementById("stat-streak");
  if (streakStat) streakStat.textContent = `${streak.total_streaks} Days`;

  // Store tab displays
  const storeCurrency = document.getElementById("store-currency");
  if (storeCurrency) storeCurrency.textContent = eco.currency_balance;

  const storeFreezes = document.getElementById("store-freezes");
  if (storeFreezes) storeFreezes.textContent = eco.streak_freezes_available;

  const storeScreentime = document.getElementById("store-screentime");
  if (storeScreentime) storeScreentime.textContent = `${eco.total_screen_time_earned_mins} Mins`;
}

function setupStoreActions() {
  const buyFreezeBtn = document.getElementById("btn-buy-freeze");
  if (buyFreezeBtn) {
    buyFreezeBtn.addEventListener("click", () => {
      const eco = store.getState().economy;
      if (eco.currency_balance < 50) {
        showToast("Insufficient currency balance! Need 50 points.", "info");
        return;
      }
      store.updateEconomy(-50, 1, 0);
      showToast("Purchased 1 Streak Freeze!", "success");
    });
  }

  const redeemScreenTimeBtn = document.getElementById("btn-redeem-screentime");
  if (redeemScreenTimeBtn) {
    redeemScreenTimeBtn.addEventListener("click", () => {
      const eco = store.getState().economy;
      if (eco.currency_balance < 30) {
        showToast("Insufficient currency balance! Need 30 points.", "info");
        return;
      }
      store.updateEconomy(-30, 0, 30);
      showToast("Unlocked +30 Mins Screen Time Reward!", "success");
    });
  }
}
