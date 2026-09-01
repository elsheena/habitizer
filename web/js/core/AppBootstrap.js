(function () {
  const scripts = [
    '/js/icons.js',
    '/js/core/StorageService.js',
    '/js/core/UserRepository.js',
    '/js/core/UserStateRepository.js',
    '/js/core/ThemeManager.js',
    '/js/core/AuthService.js',
    '/js/services/CalendarTimeUtil.js',
    '/js/services/HabitService.js',
    '/js/services/EconomyService.js',
    '/js/services/StreakService.js',
    '/js/services/CatalogService.js',
    '/js/services/IcalParserService.js',
    '/js/services/CalendarSyncService.js',
    '/js/services/CalendarService.js',
    '/js/services/CollisionEngine.js',
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
    '/js/components/CalendarDragDropController.js',
    '/js/components/CalendarDateUtil.js',
    '/js/components/CalendarMonthViewComponent.js',
    '/js/components/CalendarFloatingCardRenderer.js',
    '/js/components/CalendarGridComponent.js',
    '/js/components/PremiumModalComponent.js',
    '/js/api.js',
    '/js/sidebar.js',
    '/js/app.js'
  ];

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
