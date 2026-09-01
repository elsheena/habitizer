class CalendarService {
  constructor(authService, stateRepo) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._syncService = (typeof CalendarSyncService !== 'undefined')
      ? new CalendarSyncService(authService, stateRepo)
      : (window.CalendarSyncService ? new window.CalendarSyncService(authService, stateRepo) : null);
    this._apiBase = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  static timeToMinutes(timeStr) {
    return window.CalendarTimeUtil ? window.CalendarTimeUtil.timeToMinutes(timeStr) : 0;
  }

  static minutesToTime(min) {
    return window.CalendarTimeUtil ? window.CalendarTimeUtil.minutesToTime(min) : '00:00';
  }

  async getEvents() {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/calendar-events?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        const events = json.data || [];
        const state = this._stateRepo.load(userId);
        state.calendarEvents = events;
        this._stateRepo.save(userId, state);
        return events;
      }
    } catch (e) {
      console.warn('Backend calendar query notice, reading cache:', e);
    }
    const state = this._stateRepo.load(userId);
    return state.calendarEvents || [];
  }

  async addEvent(eventData) { return this.createEvent(eventData); }

  async createEvent(eventData) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const payload = {
      id: eventData.id || 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      user_id: userId,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      date: eventData.date || '2026-08-28',
      start_time: eventData.startTime || eventData.start_time || '09:00',
      end_time: eventData.endTime || eventData.end_time || '10:00',
      location: eventData.location || '',
      tag: eventData.tag || 'General',
      is_google_event: Boolean(eventData.isGoogleEvent || eventData.is_google_event)
    };

    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/calendar-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        const created = json.data || payload;
        const state = this._stateRepo.load(userId);
        if (!state.calendarEvents) state.calendarEvents = [];
        state.calendarEvents.push(created);
        this._stateRepo.save(userId, state);
        return created;
      }
    } catch (e) {
      console.warn('Backend calendar create notice:', e);
    }

    const state = this._stateRepo.load(userId);
    if (!state.calendarEvents) state.calendarEvents = [];
    state.calendarEvents.push(payload);
    this._stateRepo.save(userId, state);
    return payload;
  }

  async updateEvent(eventId, patch) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const state = this._stateRepo.load(userId);
    if (!state.calendarEvents) return null;

    const idx = state.calendarEvents.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      state.calendarEvents[idx] = { ...state.calendarEvents[idx], ...patch, updatedAt: new Date().toISOString() };
      this._stateRepo.save(userId, state);
    }

    try {
      await fetch(`${this._apiBase}/api/v1/habits/calendar-events?id=${encodeURIComponent(eventId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.calendarEvents[idx] || patch)
      });
    } catch (e) {
      console.warn('Backend calendar update notice:', e);
    }
    return state.calendarEvents[idx] || null;
  }

  async deleteEvent(eventId) {
    const user = await this._auth.getCurrentUser();
    const userId = user?.id || 'usr_demo';
    const state = this._stateRepo.load(userId);
    if (state.calendarEvents) {
      state.calendarEvents = state.calendarEvents.filter(e => e.id !== eventId);
      this._stateRepo.save(userId, state);
    }
    try {
      await fetch(`${this._apiBase}/api/v1/habits/calendar-events?id=${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend calendar delete notice:', e);
    }
    return true;
  }

  async updateEventScheduleScope(eventId, scope, targetDateKey, newStartTime, newEndTime, eventTitle) {
    return this.updateEvent(eventId, { date: targetDateKey, startTime: newStartTime, endTime: newEndTime, start_time: newStartTime, end_time: newEndTime });
  }

  async getFreeSlotsForDate(date, ev, s, e) { return this.getFreeSlots(date, s, e); }

  async getFreeSlots(dateKey = '2026-08-28', dayStart = '07:00', dayEnd = '22:00') {
    const events = await this.getEvents();
    const user = await this._auth.getCurrentUser();
    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/free-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id || 'usr_demo', date: dateKey, day_start: dayStart, day_end: dayEnd, events })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Backend free-slots notice:', e);
    }
    return [];
  }

  async autoScheduleHabitsIntoFreeSlots(dateKey) { return this.autoScheduleHabits(dateKey); }

  async autoScheduleHabits(dateKey = '2026-08-28') {
    const events = await this.getEvents();
    const user = await this._auth.getCurrentUser();
    try {
      const res = await fetch(`${this._apiBase}/api/v1/habits/auto-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id || 'usr_demo', date: dateKey, events })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || null;
      }
    } catch (e) {
      console.warn('Backend auto-schedule notice:', e);
    }
    return null;
  }

  async isConnected() { return this._syncService ? this._syncService.isConnected() : false; }
  async isCalendarConnected() { return this.isConnected(); }
  async getSyncInfo() { return this._syncService ? this._syncService.getSyncInfo() : {}; }
  async getCalendarSyncInfo() { return this.getSyncInfo(); }
  async connectWithIcalUrl(url) { return this._syncService ? this._syncService.connectWithIcalUrl(url) : false; }
  async importIcalUrl(url) { return this.connectWithIcalUrl(url); }
  async connectWithGoogleAccount(email) { return this._syncService ? this._syncService.connectWithGoogleAccount(email) : false; }
  async connectGoogleCalendar(code) { return this._syncService ? this._syncService.connectGoogleCalendar(code) : false; }
  async disconnect() { return this._syncService ? this._syncService.disconnect() : false; }
  async disconnectGoogleCalendar() { return this.disconnect(); }
  async loadDemoGoogleCalendar() { return this._syncService ? this._syncService.loadDemoGoogleCalendar() : false; }
}

window.CalendarService = CalendarService;
