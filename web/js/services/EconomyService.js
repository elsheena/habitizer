class EconomyService {
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getBalance() {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/analytics/economy?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const body = await res.json();
        const eco = body.data || body;
        const state = this._stateRepo.load(userId);
        state.economy = eco;
        this._stateRepo.save(userId, state);
        return eco;
      }
    } catch (err) {
      console.warn('Backend analytics economy notice:', err);
    }

    const state = this._stateRepo.load(userId);
    return state.economy || { currency_balance: 150, streak_freezes_available: 2, total_screen_time_earned_mins: 60 };
  }

  async buyStreakFreeze() {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const userTier = user?.tier || 'free';

    const res = await fetch(`${this._baseUrl}/api/v1/analytics/economy/buy-freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_tier: userTier })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to purchase streak freeze.');
    }

    const eco = body.data || body;
    const state = this._stateRepo.load(userId);
    state.economy = eco;
    this._stateRepo.save(userId, state);
    return eco;
  }

  async buyBundle() {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    const res = await fetch(`${this._baseUrl}/api/v1/analytics/economy/buy-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to purchase streak freeze bundle.');
    }

    const eco = body.data || body;
    const state = this._stateRepo.load(userId);
    state.economy = eco;
    this._stateRepo.save(userId, state);
    return eco;
  }

  async redeemPass(mins, coinPrice) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    const res = await fetch(`${this._baseUrl}/api/v1/analytics/economy/redeem-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        reward_type: mins >= 30 ? 'screen_time_30m' : 'screen_time_15m',
        currency_cost: coinPrice || (mins >= 30 ? 60 : 30)
      })
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to redeem screen time.');
    }

    const eco = body.data || body;
    const state = this._stateRepo.load(userId);
    state.economy = eco;
    this._stateRepo.save(userId, state);

    const passCode = 'HABIT-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + mins + 'M';
    return {
      economy: eco,
      passCode: passCode,
      minutes: mins
    };
  }
}

window.EconomyService = EconomyService;
