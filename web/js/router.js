// Client-Side Hash Router

const validRoutes = ["calendar", "create", "catalog", "checkin", "economy", "profile", "about"];

const routeTitles = {
  calendar: "Calendar",
  create: "New Habit",
  catalog: "Replacement Catalog",
  checkin: "Nightly Check-In",
  economy: "Economy & Rewards",
  profile: "Profile Analytics",
  about: "About & FAQ"
};

export const Router = {
  init() {
    window.addEventListener("hashchange", () => this.handleRoute());

    // If no hash is set, default to #calendar
    if (!window.location.hash) {
      window.location.hash = "#calendar";
      return; // hashchange listener will fire and call handleRoute
    }

    this.handleRoute();
  },

  navigate(routeKey) {
    if (validRoutes.includes(routeKey)) {
      window.location.hash = `#${routeKey}`;
    }
  },

  getCurrentRoute() {
    const hash = window.location.hash.replace("#", "").trim();
    return validRoutes.includes(hash) ? hash : "calendar";
  },

  handleRoute() {
    const route = this.getCurrentRoute();

    // Update browser tab title
    document.title = `Habitizer - ${routeTitles[route] || "Calendar"}`;

    // Deactivate all nav buttons and tabs
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

    // Activate target nav button & tab section
    const activeNavBtn = document.querySelector(`.nav-btn[data-tab="${route}"]`);
    if (activeNavBtn) activeNavBtn.classList.add("active");

    const targetTabEl = document.getElementById(`tab-${route}`);
    if (targetTabEl) targetTabEl.classList.add("active");

    // Close mobile menu if open
    const menu = document.getElementById("nav-center-menu");
    if (menu) menu.classList.remove("open");

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

// Expose a global navigation helper for inline onclick handlers in HTML
window.navigateTo = (route) => Router.navigate(route);
