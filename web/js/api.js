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
 */

(function () {
  // --- Instantiate Core Layer ---
  const storage      = new StorageService();
  const userRepo     = new UserRepository(storage);
  const stateRepo    = new UserStateRepository(storage);
  const backendSync  = new BackendSync();

  // --- Instantiate Services ---
  const authService    = new AuthService(storage, userRepo, stateRepo, backendSync);
  const habitService   = new HabitService(authService, stateRepo, backendSync);
  const economyService = new EconomyService(authService, stateRepo);
  const streakService  = new StreakService(authService, stateRepo);
  const catalogService = new CatalogService();

  // --- Public Facade ---
  // Preserves the exact same method signatures that page controllers call.
  const API = {
    // Auth
    isAuthenticated:  ()                       => authService.isAuthenticated(),
    requireAuth:      ()                       => authService.requireAuth(),
    login:            (email, pw)               => authService.login(email, pw),
    register:         (name, email, pw)         => authService.register(name, email, pw),
    logout:           ()                       => authService.logout(),
    getCurrentUser:   ()                       => authService.getCurrentUser(),
    toggleTier:       ()                       => authService.toggleTier(),

    // Habits
    getHabits:        ()                       => habitService.getAll(),
    createHabit:      (data)                   => habitService.create(data),
    deleteHabit:      (id)                     => habitService.delete(id),

    // Economy
    getEconomy:       ()                       => economyService.getBalance(),
    buyStreakFreeze:   ()                       => economyService.buyStreakFreeze(),
    buyBundle:        ()                       => economyService.buyBundle(),
    redeemPass:       (mins, price)            => economyService.redeemPass(mins, price),

    // Streaks & Check-ins
    getStreaks:        ()                       => streakService.getStreaks(),
    submitDailyCheckin: (data)                  => streakService.submitCheckin(data),

    // Catalog
    getCatalog:       ()                       => catalogService.getAll()
  };

  window.API = API;
})();
