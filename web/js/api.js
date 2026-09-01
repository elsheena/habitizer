(function () {
  const storage = new StorageService();
  const userRepo = new UserRepository(storage);
  const stateRepo = new UserStateRepository(storage);

  const authService = new AuthService(storage, userRepo, stateRepo);
  const habitService = new HabitService(authService, stateRepo);
  const economyService = new EconomyService(authService, stateRepo);
  const streakService = new StreakService(authService, stateRepo);
  const catalogService = new CatalogService();
  const calendarService = new CalendarService(authService, stateRepo);

  const API = {
    isAuthenticated: () => authService.isAuthenticated(),
    requireAuth: () => authService.requireAuth(),
    login: (email, pw) => authService.login(email, pw),
    register: (name, email, pw) => authService.register(name, email, pw),
    logout: () => authService.logout(),
    getCurrentUser: () => authService.getCurrentUser(),
    toggleTier: () => authService.toggleTier(),

    getHabits: () => habitService.getAll(),
    createHabit: (data) => habitService.create(data),
    updateHabit: (id, updates) => habitService.updateHabit(id, updates),
    deleteHabit: (id) => habitService.delete(id),
    updateHabitTime: (id, newTime) => habitService.updateScheduledTime(id, newTime),
    getEffectiveHabitTime: (habit, dateKey) => habitService.getEffectiveTimeForDate(habit, dateKey),
    updateHabitScheduleScope: (id, scope, dateKey, newTime) => habitService.updateScheduleScope(id, scope, dateKey, newTime),
    getEffectiveHabitSchedule: (dateKey) => habitService.getEffectiveSchedule(dateKey),

    getEconomy: () => economyService.getBalance(),
    buyStreakFreeze: () => economyService.buyStreakFreeze(),
    buyBundle: () => economyService.buyBundle(),
    redeemPass: (mins, price) => economyService.redeemPass(mins, price),
    redeemScreenTime: (mins, price) => economyService.redeemPass(mins, price),

    getStreaks: () => streakService.getStreaks(),
    submitDailyCheckin: (data) => streakService.submitCheckin(data),

    getCatalog: () => catalogService.getAll(),

    isCalendarConnected: () => calendarService.isConnected(),
    getCalendarSyncInfo: () => calendarService.getSyncInfo(),
    getCalendarEvents: () => calendarService.getEvents(),
    addCalendarEvent: (data) => calendarService.addEvent(data),
    updateCalendarEvent: (id, updates) => calendarService.updateEvent(id, updates),
    deleteCalendarEvent: (id) => calendarService.deleteEvent(id),
    updateEventScheduleScope: (id, scope, dateKey, sTime, eTime, title) => calendarService.updateEventScheduleScope(id, scope, dateKey, sTime, eTime, title),
    connectCalendarIcal: (url) => calendarService.connectWithIcalUrl(url),
    connectCalendarGoogle: (email) => calendarService.connectWithGoogleAccount(email),
    disconnectCalendar: () => calendarService.disconnect(),
    getFreeSlots: (date, ev, s, e) => calendarService.getFreeSlotsForDate(date, ev, s, e),
    autoScheduleHabitsIntoFreeSlots: (date) => calendarService.autoScheduleHabitsIntoFreeSlots(date)
  };

  window.API = API;
})();
