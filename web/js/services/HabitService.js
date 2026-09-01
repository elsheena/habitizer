class HabitService {
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._apiBase = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  async getAll(userId) { return this.getHabits(userId); }

  async getHabits(userId) {
    if (!userId) {
      const user = await this._auth.getCurrentUser();
      userId = user?.id || 'usr_demo';
    }
    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        const habits = json.data || [];
        const state = this._stateRepo.load(userId);
        state.habits = habits;
        this._stateRepo.save(userId, state);
        return habits;
      }
    } catch (e) {
      console.warn('Backend habit query error, reading cache:', e);
    }
    const state = this._stateRepo.load(userId);
    return state.habits || [];
  }

  async create(habitData) { return this.createHabit(habitData); }

  async createHabit(habitData) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const payload = {
      user_id: userId,
      user_tier: user?.tier || 'free',
      bad_habit: habitData.bad_habit,
      frequency: habitData.frequency || 'daily',
      scheduled_time: habitData.scheduled_time || '09:00',
      cue_trigger: habitData.cue_trigger || '',
      replacement_habit: habitData.replacement_habit || '',
      reward: habitData.reward || '',
      category: habitData.category || 'General',
      preferred_window_start: habitData.preferred_window_start || '18:00',
      preferred_window_end: habitData.preferred_window_end || '22:00'
    };

    const res = await fetch(`${this._apiBase}/api/v1/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to create habit');
    }

    const created = body.data || payload;
    const state = this._stateRepo.load(userId);
    if (!state.habits) state.habits = [];
    state.habits.push(created);
    this._stateRepo.save(userId, state);
    return created;
  }

  async delete(habitId) { return this.deleteHabit(habitId); }

  async deleteHabit(habitId) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const res = await fetch(`${this._apiBase}/api/v1/habits?id=${encodeURIComponent(habitId)}`, { method: 'DELETE' });
    const state = this._stateRepo.load(userId);
    if (state.habits) {
      state.habits = state.habits.filter(h => h.id !== habitId);
      this._stateRepo.save(userId, state);
    }
    return res.ok;
  }

  async updateScheduledTime(habitId, newTime) { return this.updateScheduleScope(habitId, 'all', '', newTime); }
  async updateHabitTime(habitId, newTime) { return this.updateScheduleScope(habitId, 'all', '', newTime); }

  getEffectiveTimeForDate(habit, dateKey) {
    if (!habit) return '09:00';
    if (habit.date_overrides && habit.date_overrides[dateKey]) return habit.date_overrides[dateKey];
    return habit.scheduled_time || '09:00';
  }

  async updateScheduleScope(habitId, scope, targetDateKey, newTime) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';

    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/schedule-scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          user_id: userId,
          scope: scope || 'all',
          target_date_key: targetDateKey || '2026-08-28',
          new_time: newTime
        })
      });
      if (res.ok) {
        const json = await res.json();
        const state = this._stateRepo.load(userId);
        const target = state.habits?.find(h => h.id === habitId);
        if (target) {
          if (scope === 'all') target.scheduled_time = newTime;
          else {
            if (!target.date_overrides) target.date_overrides = {};
            target.date_overrides[targetDateKey] = newTime;
          }
          this._stateRepo.save(userId, state);
        }
        return json.data;
      }
    } catch (e) {
      console.warn('Backend schedule-scope notice:', e);
    }
    return null;
  }

  async getEffectiveSchedule(dateKey) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/effective-schedule?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(dateKey)}`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Backend effective-schedule notice:', e);
    }
    return [];
  }

  async processDailyCheckin(habitId, didBadHabit, usedReplacement, replacementNote) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const payload = {
      user_id: userId,
      habit_id: habitId,
      checkin_date: new Date().toISOString().split('T')[0],
      did_bad_habit: didBadHabit,
      used_replacement: usedReplacement,
      replacement_note: replacementNote || ''
    };
    const res = await fetch(`${this._apiBase}/api/v1/habits/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async promoteReplacement(habitId, newRoutineTitle) {
    const res = await fetch(`${this._apiBase}/api/v1/habits/promote-replacement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, replacement_habit: newRoutineTitle })
    });
    return res.json();
  }
}

window.HabitService = HabitService;
