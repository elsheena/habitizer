/**
 * Habitizer API Facade
 *
 * Thin coordinator that wires together the core and service classes,
 * then exposes the same window.API interface that all page controllers expect.
 * No business logic lives here — each method delegates to a focused service.
 *
 * Dependency graph:
 *   StorageService
 *     └─ UserRepository
 *     └─ UserStateRepository
 *   BackendSync
 *   AuthService(storage, userRepo, stateRepo, backendSync)
 *   HabitService(auth, stateRepo, backendSync)
 *   EconomyService(auth, stateRepo)
 *   StreakService(auth, stateRepo)
 *   CatalogService()
 *   CalendarService(auth, stateRepo, backendSync)
 */

(function () {
  // --- Instantiate Core Layer ---
  const storage      = new StorageService();
  const userRepo     = new UserRepository(storage);
  const stateRepo    = new UserStateRepository(storage);
  const backendSync  = new BackendSync();

  // --- Instantiate Services ---
  const authService     = new AuthService(storage, userRepo, stateRepo, backendSync);
  const habitService    = new HabitService(authService, stateRepo, backendSync);
  const economyService  = new EconomyService(authService, stateRepo);
  const streakService   = new StreakService(authService, stateRepo);
  const catalogService  = new CatalogService();
  const calendarService = new CalendarService(authService, stateRepo, backendSync);

  // --- Public Facade ---
  const API = {
    // Auth
    isAuthenticated:  ()                       => authService.isAuthenticated(),
    requireAuth:      ()                       => authService.requireAuth(),
    login:            (email, pw)               => authService.login(email, pw),
    register:         (name, email, pw)         => authService.register(name, email, pw),
    logout:           ()                       => authService.logout(),
    getCurrentUser:   ()                       => authService.getCurrentUser(),
    toggleTier:       ()                       => authService.toggleTier(),

    // Habits & Recurring Schedules
    getHabits:                ()                               => habitService.getAll(),
    createHabit:              (data)                           => habitService.create(data),
    updateHabit:              (id, updates)                    => habitService.update(id, updates),
    deleteHabit:              (id)                             => habitService.delete(id),
    updateHabitTime:          (id, newTime)                    => habitService.updateScheduledTime(id, newTime),
    getEffectiveHabitTime:    (habit, dateKey)                 => habitService.getEffectiveTimeForDate(habit, dateKey),
    updateHabitScheduleScope: (id, scope, dateKey, newTime)    => habitService.updateScheduleScope(id, scope, dateKey, newTime),

    // Economy
    getEconomy:       ()                       => economyService.getBalance(),
    buyStreakFreeze:   ()                       => economyService.buyStreakFreeze(),
    buyBundle:        ()                       => economyService.buyBundle(),
    redeemPass:       (mins, price)            => economyService.redeemPass(mins, price),

    // Streaks & Check-ins
    getStreaks:        ()                       => streakService.getStreaks(),
    submitDailyCheckin: (data)                  => streakService.submitCheckin(data),

    // Catalog
    getCatalog:       ()                       => catalogService.getAll(),

    // Google Calendar & Smart Scheduler
    isCalendarConnected:            ()                 => calendarService.isConnected(),
    getCalendarSyncInfo:            ()                 => calendarService.getSyncInfo(),
    getCalendarEvents:              ()                 => calendarService.getEvents(),
    addCalendarEvent:               (data)             => calendarService.addEvent(data),
    updateCalendarEvent:            (id, updates)      => calendarService.updateEvent(id, updates),
    deleteCalendarEvent:            (id)               => calendarService.deleteEvent(id),
    updateEventScheduleScope:       (id, scope, dateKey, sTime, eTime, title) => calendarService.updateEventScheduleScope(id, scope, dateKey, sTime, eTime, title),
    connectCalendarIcal:            (url)              => calendarService.connectWithIcalUrl(url),
    connectCalendarGoogle:          (email)            => calendarService.connectWithGoogleAccount(email),
    disconnectCalendar:             ()                 => calendarService.disconnect(),
    getFreeSlots:                   (date, ev, s, e)   => calendarService.getFreeSlotsForDate(date, ev, s, e),
    detectCalendarConflicts:        (h, ev, date)      => calendarService.detectConflicts(h, ev, date),
    autoScheduleHabitsIntoFreeSlots: (date)             => calendarService.autoScheduleHabitsIntoFreeSlots(date)
  };

  window.API = API;
})();
