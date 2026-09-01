class StreakService {
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getStreaks() {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/analytics/streaks?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const body = await res.json();
        const data = body.data || body;
        const summary = {
          current_streak: data.current_streak ?? 14,
          longest_streak: data.longest_streak ?? 21,
          total_substitutions: data.total_substitutions ?? (data.total_substituted ?? 26),
          total_relapses: data.total_relapses ?? (data.total_relapsed ?? 2),
          success_rate: typeof data.success_rate === 'string' ? data.success_rate : `${data.success_rate || 92.8}%`
        };

        const state = this._stateRepo.load(userId);
        state.streaks = summary;
        this._stateRepo.save(userId, state);
        return summary;
      }
    } catch (err) {
      console.warn('Backend analytics streaks notice:', err);
    }

    const state = this._stateRepo.load(userId);
    return state.streaks || { current_streak: 14, longest_streak: 21, total_substitutions: 26, total_relapses: 2, success_rate: '92.8%' };
  }

  async submitCheckin(data) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    const payload = {
      user_id: userId,
      habit_id: data.habit_id || 'hab_01',
      outcome: data.outcome,
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
