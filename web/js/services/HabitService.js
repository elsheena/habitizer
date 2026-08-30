/**
 * HabitService — Habit Client for Go Habit-Service.
 * Single Responsibility: Delegate habit CRUD and scheduling requests directly to Go backend microservice.
 */
class HabitService {
  constructor(authService, stateRepo, backendSync) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._baseUrl = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getAll() {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/habits?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const body = await res.json();
        const habits = body.data || body || [];
        // Cache to local state for offline resiliency
        const state = this._stateRepo.load(userId);
        state.habits = habits;
        this._stateRepo.save(userId, state);
        return habits;
      }
    } catch (err) {
      console.warn('Backend habit-service unreachable, loading offline cache:', err);
    }

    const state = this._stateRepo.load(userId);
    return state.habits || [];
  }

  async create(habitData) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';
    const userTier = user.tier || 'free';

    const payload = {
      user_id: userId,
      user_tier: userTier,
      bad_habit: habitData.bad_habit,
      frequency: habitData.frequency || 'daily',
      scheduled_time: habitData.scheduled_time || '09:00',
      cue_trigger: habitData.cue_trigger,
      replacement_habit: habitData.replacement_habit || '5-Minute Deep Breathing',
      reward: habitData.reward || '10 Shop Coins',
      category: habitData.category || 'General'
    };

    const res = await fetch(`${this._baseUrl}/api/v1/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to create habit loop.');
    }

    const created = body.data || body;
    // Update local state cache
    const state = this._stateRepo.load(userId);
    state.habits.unshift(created);
    this._stateRepo.save(userId, state);

    return created;
  }

  async update(habitId, updates) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    if (updates.scheduled_time) {
      return this.updateScheduledTime(habitId, updates.scheduled_time);
    }

    const state = this._stateRepo.load(userId);
    const target = state.habits.find(h => h.id === habitId);
    if (target) {
      Object.assign(target, updates);
      this._stateRepo.save(userId, state);
      return target;
    }
    return null;
  }

  async updateScheduledTime(habitId, newTime) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    try {
      const res = await fetch(`${this._baseUrl}/api/v1/habits/update-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habit_id: habitId, scheduled_time: newTime })
      });

      if (res.ok) {
        const body = await res.json();
        const updated = body.data || body;
        const state = this._stateRepo.load(userId);
        const target = state.habits.find(h => h.id === habitId);
        if (target) {
          target.scheduled_time = newTime;
          this._stateRepo.save(userId, state);
        }
        return updated;
      }
    } catch (err) {
      console.warn('Backend update-time failed, updating local cache:', err);
    }

    const state = this._stateRepo.load(userId);
    const target = state.habits.find(h => h.id === habitId);
    if (target) {
      target.scheduled_time = newTime;
      this._stateRepo.save(userId, state);
      return target;
    }
    return null;
  }

  async delete(habitId) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';

    try {
      await fetch(`${this._baseUrl}/api/v1/habits?id=${encodeURIComponent(habitId)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }

    const state = this._stateRepo.load(userId);
    state.habits = state.habits.filter(h => h.id !== habitId);
    this._stateRepo.save(userId, state);
    return true;
  }
}

window.HabitService = HabitService;
