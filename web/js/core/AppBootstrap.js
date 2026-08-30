/**
 * AppBootstrap — Unified Client Application Loader & Dependency Orchestrator.
 * Single Responsibility: Coordinate standardized loading order of Core, Services, Components,
 * and API Facade layers, eliminating Shotgun Surgery across HTML entry points.
 *
 * Implemented per UML 2.0 Architectural Specifications.
 */
(function () {
  const scripts = [
    // 1. Foundation & Design Icons
    '/js/icons.js',

    // 2. Core Domain & Persistence Layer
    '/js/core/StorageService.js',
    '/js/core/UserRepository.js',
    '/js/core/UserStateRepository.js',
    '/js/core/ThemeManager.js',

    // 3. Service Layer
    '/js/services/BackendSync.js',
    '/js/core/AuthService.js',
    '/js/services/HabitService.js',
    '/js/services/EconomyService.js',
    '/js/services/StreakService.js',
    '/js/services/CatalogService.js',
    '/js/services/CalendarService.js',
    '/js/services/CollisionEngine.js',

    // 4. UI Components Layer (OOP Hierarchy extending UIComponent)
    '/js/components/UIComponent.js',
    '/js/components/ToastComponent.js',
    '/js/components/NavbarComponent.js',
    '/js/components/HabitCardComponent.js',
    '/js/components/StatsGridComponent.js',
    '/js/components/CatalogCardComponent.js',
    '/js/components/DayLogModalComponent.js',
    '/js/components/SlotCreationModalComponent.js',
    '/js/components/EventDetailModalComponent.js',
    '/js/components/RescheduleScopeModalComponent.js',
    '/js/components/CalendarGridComponent.js',
    '/js/components/PremiumModalComponent.js',

    // 5. Unified API Facade & Sidebar Helpers
    '/js/api.js',
    '/js/sidebar.js',
    '/js/app.js'
  ];

  // Dynamic Sequential Loader for pages using AppBootstrap
  window.AppBootstrap = {
    load: function (callback) {
      let index = 0;
      function next() {
        if (index >= scripts.length) {
          if (typeof callback === 'function') callback();
          return;
        }
        const src = scripts[index++];
        const s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = next;
        s.onerror = (e) => {
          console.error(`Failed to load dependency: ${src}`, e);
          next();
        };
        document.head.appendChild(s);
      }
      next();
    }
  };
})();
