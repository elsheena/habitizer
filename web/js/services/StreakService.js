/**
 * StreakService — Streak & Check-in Client for Go Backend Services.
 * Single Responsibility: Delegate streak analytics and nightly check-in processing to Go backend microservices.
 */
class StreakService {
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getStreaks() {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/analytics/streaks?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const body = await res.json();
        const streaks = body.data || body;
        const state = this._stateRepo.load(userId);
        state.streaks = streaks;
        this._stateRepo.save(userId, state);
        return streaks;
      }
    } catch (err) {
      console.warn('Backend analytics-service unreachable, reading local streaks cache:', err);
    }

    const state = this._stateRepo.load(userId);
    return state.streaks || { current_streak: 12, longest_streak: 18, total_substitutions: 45, total_relapses: 3, success_rate: '93%' };
  }

  async submitCheckin(data) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    const payload = {
      user_id: userId,
      habit_id: data.habit_id || 'hab_01',
      outcome: data.outcome, // 'clean' or 'relapse'
      custom_replacement_used: Boolean(data.custom_routine_text),
      custom_replacement_text: data.custom_routine_text || ''
    };

    const res = await fetch(`${this._baseUrl}/api/v1/habits/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to record check-in.');
    }

    const result = body.data || body;
    return {
      auto_promoted: result.auto_promoted || false,
      promoted_routine: result.promoted_routine || null,
      coins_earned: data.outcome === 'clean' ? 10 : 0
    };
  }
}

window.StreakService = StreakService;
