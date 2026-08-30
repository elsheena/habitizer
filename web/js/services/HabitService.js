/**
 * HabitService — Habit CRUD operations.
 * Single Responsibility: Create, read, and delete habit substitution loops.
 */
class HabitService {
  /** @type {number} Maximum active habits for free-tier users. */
  static FREE_TIER_LIMIT = 3;

  /**
   * @param {AuthService} authService
   * @param {UserStateRepository} stateRepo
   * @param {BackendSync} backendSync
   */
  constructor(authService, stateRepo, backendSync) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._backendSync = backendSync;
  }

  /**
   * Get all habits for the currently authenticated user.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    if (!this._auth.isAuthenticated()) return [];
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    return state.habits || [];
  }

  /**
   * Create a new habit substitution loop.
   * @param {Object} habitData — partial habit fields from the form
   * @returns {Promise<Object>} the created habit
   * @throws {Error} if not authenticated or free-tier limit reached
   */
  async create(habitData) {
    if (!this._auth.isAuthenticated()) {
      throw new Error('Authentication required.');
    }

    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);

    const activeCount = state.habits.filter(h => h.is_active).length;
    if (user.tier === 'free' && activeCount >= HabitService.FREE_TIER_LIMIT) {
      throw new Error('Free Tier limit reached (max 3 active habits). Upgrade to Premium in profile.');
    }

    const newHabit = {
      id: HabitService._generateId(),
      bad_habit: habitData.bad_habit,
      frequency: habitData.frequency || 'daily',
      scheduled_time: habitData.scheduled_time || '09:00',
      cue_trigger: habitData.cue_trigger,
      replacement_habit: habitData.replacement_habit || '5-Minute Deep Breathing',
      reward: habitData.reward || '10 Shop Coins',
      category: habitData.category || 'General',
      is_active: true,
      created_at: new Date().toISOString()
    };

    state.habits.unshift(newHabit);
    this._stateRepo.save(user.id, state);
    this._backendSync.syncHabitCreate(newHabit, user.id);

    return newHabit;
  }

  /**
   * Update a habit record.
   * @param {string} habitId
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  async update(habitId, updates) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    const target = state.habits.find(h => h.id === habitId);
    if (target) {
      Object.assign(target, updates);
      this._stateRepo.save(user.id, state);
      return target;
    }
    return null;
  }

  /**
   * Update the scheduled time for a habit (e.g. when auto-scheduled into a free slot).
   * @param {string} habitId
   * @param {string} newTime
   * @returns {Promise<Object|null>}
   */
  async updateScheduledTime(habitId, newTime) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    const target = state.habits.find(h => h.id === habitId);
    if (target) {
      target.scheduled_time = newTime;
      this._stateRepo.save(user.id, state);
      return target;
    }
    return null;
  }

  /**
   * Delete a habit by ID.
   * @param {string} habitId
   * @returns {Promise<boolean>}
   */
  async delete(habitId) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    state.habits = state.habits.filter(h => h.id !== habitId);
    this._stateRepo.save(user.id, state);
    this._backendSync.syncHabitDelete(habitId);
    return true;
  }

  /**
   * Generate a unique habit ID.
   * @returns {string}
   * @private
   */
  static _generateId() {
    return 'hab_' + Math.random().toString(36).substr(2, 9);
  }
}

window.HabitService = HabitService;
