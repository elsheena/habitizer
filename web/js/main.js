// Habitizer Application Entry Point (ES Module Bootstrap & Router)

import { store } from "./state.js";
import { ApiClient } from "./api.js";
import { Router } from "./router.js";
import { initHeader } from "./components/header.js";
import { initCalendarPage } from "./pages/calendar.js";
import { initCreateHabitPage } from "./pages/create_habit.js";
import { initCatalogPage } from "./pages/catalog.js";
import { initCheckinPage } from "./pages/checkin.js";
import { initEconomyPage } from "./pages/economy.js";
import { initProfilePage } from "./pages/profile.js";
import { initAboutPage } from "./pages/about.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Header Component
  initHeader();

  // Initialize Page Controllers
  initCalendarPage();
  initCreateHabitPage();
  initCatalogPage();
  initCheckinPage();
  initEconomyPage();
  initProfilePage();
  initAboutPage();

  // Initialize Client Router
  Router.init();

  // Check Gateway API Status
  const isHealthy = await ApiClient.checkHealth();
  if (isHealthy) {
    const habits = await ApiClient.fetchUserHabits();
    if (habits && habits.length > 0) {
      store.setHabits(habits);
    }
  }
});
