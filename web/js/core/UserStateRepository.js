/**
 * UserStateRepository — Per-user isolated state persistence.
 * Single Responsibility: Load/save per-user habits, streaks, economy, checkins.
 */
class UserStateRepository {
  /**
   * @param {StorageService} storage
   */
  constructor(storage) {
    this._storage = storage;
  }

  /**
   * Load the full state object for a given user.
   * Returns mock demo data for the mock user, fresh empty state for new users.
   * @param {string} userId
   * @returns {Object}
   */
  load(userId) {
    if (!userId) userId = 'guest';
    const key = UserStateRepository._key(userId);
    const saved = this._storage.getJSON(key, null);

    if (saved) return saved;

    // Mock account gets rich demo data
    if (userId === UserRepository.MOCK_USER_ID) {
      const mockState = UserStateRepository.createMockState();
      this._storage.setJSON(key, mockState);
      return JSON.parse(JSON.stringify(mockState));
    }

    // New regular users start clean
    const freshState = UserStateRepository.createFreshState();
    this._storage.setJSON(key, freshState);
    return freshState;
  }

  /**
   * Persist the full state object for a given user.
   * @param {string} userId
   * @param {Object} state
   */
  save(userId, state) {
    if (!userId) userId = 'guest';
    this._storage.setJSON(UserStateRepository._key(userId), state);
  }

  /**
   * Build the localStorage key for a user's state.
   * @param {string} userId
   * @returns {string}
   * @private
   */
  static _key(userId) {
    return `habitizer_user_state_${userId}`;
  }

  /**
   * Create an empty state object for newly registered users.
   * @returns {Object}
   */
  static createFreshState() {
    return {
      habits: [],
      streaks: {
        current_streak: 0,
        longest_streak: 0,
        total_substitutions: 0,
        total_relapses: 0,
        success_rate: '0%'
      },
      economy: {
        currency_balance: 50,
        streak_freezes_available: 2,
        total_screen_time_earned_mins: 0
      },
      checkins: {},
      googleCalendarSynced: false
    };
  }

  /**
   * Create a rich demo state for the mock account.
   * @returns {Object}
   */
  static createMockState() {
    return {
      habits: [
        {
          id: 'hab_01',
          bad_habit: 'Late night junk food snacking',
          frequency: 'daily',
          scheduled_time: '22:30',
          cue_trigger: 'Stress or boredom after 10 PM',
          replacement_habit: 'Drink chamomile tea & 5 min breathing',
          reward: '15 min gaming pass tomorrow',
          category: 'Health & Diet',
          is_active: true,
          created_at: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
          id: 'hab_02',
          bad_habit: 'Endless social media scrolling in bed',
          frequency: 'daily',
          scheduled_time: '23:00',
          cue_trigger: 'Lying in bed with phone in hand',
          replacement_habit: 'Read 5 pages of Kindle novel',
          reward: 'Logged in habit diary',
          category: 'Focus & Digital Wellbeing',
          is_active: true,
          created_at: new Date(Date.now() - 10 * 86400000).toISOString()
        },
        {
          id: 'hab_03',
          bad_habit: 'Skipping morning posture stretches',
          frequency: 'daily',
          scheduled_time: '08:15',
          cue_trigger: 'Sitting at desk immediately upon waking',
          replacement_habit: '10-minute cat-cow & hamstring stretch',
          reward: 'Fresh espresso cup',
          category: 'Fitness & Posture',
          is_active: true,
          created_at: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ],
      streaks: {
        current_streak: 14,
        longest_streak: 21,
        total_substitutions: 26,
        total_relapses: 2,
        success_rate: '92.8%'
      },
      economy: {
        currency_balance: 150,
        streak_freezes_available: 2,
        total_screen_time_earned_mins: 45
      },
      checkins: {},
      googleCalendarSynced: true
    };
  }
}

window.UserStateRepository = UserStateRepository;
