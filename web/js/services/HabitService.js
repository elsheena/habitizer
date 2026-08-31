/**
 * HabitService — Habit Client for Go Habit-Service.
 * Single Responsibility: Delegate habit CRUD and recurring schedule scope calculations
 * ('single' date override, 'future' series transition without mutating past history, 'all' global series update)
 * directly to Go backend and state repo.
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
        const state = this._stateRepo.load(userId);

        // Merge backend habits with local schedule overrides
        const mergedHabits = habits.map(h => {
          const cached = (state.habits || []).find(c => c.id === h.id);
          if (cached) {
            return {
              ...h,
              initial_time: cached.initial_time || h.scheduled_time,
              date_overrides: cached.date_overrides || {},
              future_overrides: cached.future_overrides || []
            };
          }
          return {
            ...h,
            initial_time: h.scheduled_time,
            date_overrides: {},
            future_overrides: []
          };
        });

        state.habits = mergedHabits;
        this._stateRepo.save(userId, state);
        return mergedHabits;
      }
    } catch (err) {
      console.warn('Backend habit-service unreachable, loading offline cache:', err);
    }

    const state = this._stateRepo.load(userId);
    return state.habits || [];
  }

  getEffectiveTimeForDate(habit, dateKey) {
    if (!habit) return '09:00';

    // 1. Single-day override takes highest priority
    if (habit.date_overrides && habit.date_overrides[dateKey]) {
      return habit.date_overrides[dateKey];
    }

    // 2. Future series overrides timeline check
    if (habit.future_overrides && Array.isArray(habit.future_overrides) && habit.future_overrides.length > 0) {
      const sorted = [...habit.future_overrides].sort((a, b) => b.fromDate.localeCompare(a.fromDate));
      
      // Find the most recent future override that applies on or before dateKey
      const applicable = sorted.find(ov => ov.fromDate <= dateKey);
      if (applicable) {
        return applicable.time;
      }

      // If dateKey is strictly before the earliest future override, return the initial base time (past is protected)
      const earliest = sorted[sorted.length - 1];
      if (earliest && dateKey < earliest.fromDate) {
        return earliest.baseTimeBefore || earliest.prevTime || habit.initial_time || habit.scheduled_time || '09:00';
      }
    }

    return habit.scheduled_time || '09:00';
  }

  async updateScheduleScope(habitId, scope, targetDateKey, newTime) {
    const user = await this._auth.getCurrentUser();
    const userId = user.id || 'usr_demo';
    const state = this._stateRepo.load(userId);
    const target = (state.habits || []).find(h => h.id === habitId);

    if (!target) return null;

    if (scope === 'all') {
      target.scheduled_time = newTime;
      target.initial_time = newTime;
      target.date_overrides = {};
      target.future_overrides = [];
      await this.updateScheduledTime(habitId, newTime);
    } else if (scope === 'future') {
      const currentTimeOnTarget = this.getEffectiveTimeForDate(target, targetDateKey) || target.scheduled_time || '09:00';
      const baseTimeBefore = target.initial_time || target.scheduled_time || '09:00';

      if (!target.initial_time) {
        target.initial_time = target.scheduled_time || '09:00';
      }

      if (!target.future_overrides) target.future_overrides = [];

      const existingIdx = target.future_overrides.findIndex(ov => ov.fromDate === targetDateKey);
      const overrideRecord = {
        fromDate: targetDateKey,
        time: newTime,
        baseTimeBefore: baseTimeBefore,
        prevTime: currentTimeOnTarget
      };

      if (existingIdx >= 0) {
        target.future_overrides[existingIdx] = overrideRecord;
      } else {
        target.future_overrides.push(overrideRecord);
      }
    } else {
      // scope === 'single' ("This event only")
      if (!target.date_overrides) target.date_overrides = {};
      target.date_overrides[targetDateKey] = newTime;
    }

    this._stateRepo.save(userId, state);
    return target;
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
    created.date_overrides = {};
    created.future_overrides = [];
    created.initial_time = created.scheduled_time;

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
        const state = this._stateRepo.load(userId);
        const target = state.habits.find(h => h.id === habitId);
        if (target) {
          target.scheduled_time = newTime;
          this._stateRepo.save(userId, state);
        }
        return body.data || body;
      }
    } catch (err) {
      console.warn('Backend updateScheduledTime notice:', err);
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
      const res = await fetch(`${this._baseUrl}/api/v1/habits?id=${encodeURIComponent(habitId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const state = this._stateRepo.load(userId);
        state.habits = state.habits.filter(h => h.id !== habitId);
        this._stateRepo.save(userId, state);
        return true;
      }
    } catch (err) {
      console.warn('Backend delete notice:', err);
    }

    const state = this._stateRepo.load(userId);
    state.habits = state.habits.filter(h => h.id !== habitId);
    this._stateRepo.save(userId, state);
    return true;
  }
}

window.HabitService = HabitService;
