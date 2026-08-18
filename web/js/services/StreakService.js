/**
 * StreakService — Streak analytics and daily check-in processing.
 * Single Responsibility: Streak calculations, checkin recording, success rate.
 */
class StreakService {
  /** @type {number} Coins awarded per clean day. */
  static CLEAN_DAY_REWARD = 10;

  /**
   * @param {AuthService} authService
   * @param {UserStateRepository} stateRepo
   */
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
  }

  /**
   * Get streak analytics for the current user.
   * @returns {Promise<Object>} { current_streak, longest_streak, total_substitutions, total_relapses, success_rate }
   */
  async getStreaks() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    return state.streaks;
  }

  /**
   * Submit a daily check-in and update streaks/economy accordingly.
   * @param {Object} data — { habit_id, did_bad_habit, used_replacement, replacement_note, date? }
   * @returns {Promise<Object>} { success, streak, currency, freezes }
   */
  async submitCheckin(data) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    const dateKey = data.date || new Date().toISOString().split('T')[0];

    // Record the check-in
    state.checkins[dateKey] = {
      ...data,
      timestamp: new Date().toISOString()
    };

    // Process outcome
    if (data.did_bad_habit === false) {
      this._processCleanDay(state);
    } else {
      this._processRelapse(state);
    }

    // Recalculate success rate
    state.streaks.success_rate = StreakService._calculateSuccessRate(state.streaks);

    this._stateRepo.save(user.id, state);

    return {
      success: true,
      streak: state.streaks.current_streak,
      currency: state.economy.currency_balance,
      freezes: state.economy.streak_freezes_available
    };
  }

  /**
   * Update state for a clean (substituted) day.
   * @param {Object} state — mutable user state
   * @private
   */
  _processCleanDay(state) {
    state.streaks.current_streak += 1;
    if (state.streaks.current_streak > state.streaks.longest_streak) {
      state.streaks.longest_streak = state.streaks.current_streak;
    }
    state.streaks.total_substitutions += 1;
    state.economy.currency_balance += StreakService.CLEAN_DAY_REWARD;
  }

  /**
   * Update state for a relapse day (auto-consuming a freeze if available).
   * @param {Object} state — mutable user state
   * @private
   */
  _processRelapse(state) {
    if (state.economy.streak_freezes_available > 0) {
      state.economy.streak_freezes_available -= 1;
    } else {
      state.streaks.current_streak = 0;
    }
    state.streaks.total_relapses += 1;
  }

  /**
   * Calculate the substitution success rate as a formatted string.
   * @param {Object} streaks — { total_substitutions, total_relapses }
   * @returns {string}
   * @private
   */
  static _calculateSuccessRate(streaks) {
    const total = streaks.total_substitutions + streaks.total_relapses;
    if (total === 0) return '0%';
    return `${Math.round((streaks.total_substitutions / total) * 100)}%`;
  }
}

window.StreakService = StreakService;
