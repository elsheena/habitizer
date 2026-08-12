// Header Navigation Component

import { store } from "../state.js";
import { Router } from "../router.js";
import { showToast } from "../toast.js";

export function initHeader() {
  setupNavigation();
  setupTierBadge();
  setupMobileMenu();

  store.subscribe((eventKey) => {
    if (eventKey === "USER_TIER_CHANGED" || eventKey === "HABITS_UPDATED" || eventKey === "HABIT_ADDED" || eventKey === "HABIT_REMOVED") {
      updateTierUI();
    }
  });
}

function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      Router.navigate(targetTab);
    });
  });
}

function setupMobileMenu() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const menu = document.getElementById("nav-center-menu");
      if (menu) menu.classList.toggle("open");
    });
  }
}

function setupTierBadge() {
  const badge = document.getElementById("user-tier-badge");
  if (badge) {
    badge.addEventListener("click", () => {
      const currentTier = store.getState().userTier;
      if (currentTier === "free") {
        store.setUserTier("premium");
        showToast("Upgraded to Premium Tier! Unlimited habit creation unlocked.", "success");
      } else {
        store.setUserTier("free");
        showToast("Switched to Free Tier (3 Habit Limit)", "info");
      }
    });
  }
  updateTierUI();
}

export function updateTierUI() {
  const state = store.getState();
  const badge = document.getElementById("user-tier-badge");
  const profileText = document.getElementById("profile-tier-text");
  
  if (state.userTier === "premium") {
    if (badge) {
      badge.className = "tier-badge premium";
      badge.textContent = "Premium Tier (Unlimited)";
    }
    if (profileText) profileText.textContent = "Premium Tier (Unlimited Habits)";
  } else {
    if (badge) {
      badge.className = "tier-badge free";
      badge.textContent = `Free Tier (${state.habits.length}/3 Habits)`;
    }
    if (profileText) profileText.textContent = `Free Tier (${state.habits.length}/3 Habits Max)`;
  }
}
