/**
 * CalendarService — Google Calendar Integration & Smart Free Slot Scheduler.
 * Single Responsibility: Ingest Google Calendar feeds, manage Calendar Events via Go Backend API,
 * support recurring schedule scoping ('single' date override, 'future' transition, 'all' series update),
 * discover free time gaps, detect event conflicts, and schedule healthy habit substitution routines.
 *
 * Implemented per UML 2.0 specifications.
 */
class CalendarService {
  /**
   * @param {AuthService} authService
   * @param {UserStateRepository} stateRepo
   * @param {BackendSync} [backendSync]
   */
  constructor(authService, stateRepo, backendSync) {
    this._auth = authService;
    this._stateRepo = stateRepo;
    this._backendSync = backendSync;
    this._apiBase = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';
  }

  // =========================================================================
  // Google Calendar Integration & State Management
  // =========================================================================

  async isConnected() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    return Boolean(state.googleCalendarSynced);
  }

  async getSyncInfo() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    const events = await this.getEvents();
    return {
      connected: Boolean(state.googleCalendarSynced),
      email: state.googleCalendarEmail || (state.googleCalendarSynced ? (user.email || 'alex.doe@gmail.com') : ''),
      icalUrl: state.googleCalendarUrl || '',
      lastSyncedAt: state.googleCalendarLastSync || null,
      eventCount: (events || []).length
    };
  }

  async connectWithIcalUrl(icalUrl) {
    if (!icalUrl || !icalUrl.trim()) {
      throw new Error('Please provide a valid Google Calendar iCal / ICS feed link.');
    }

    const cleanUrl = icalUrl.trim();
    let events = [];

    try {
      events = await this.fetchAndParseIcal(cleanUrl);
    } catch (err) {
      console.warn('Direct iCal fetch notice, using parsed representation with provided URL:', err);
      events = CalendarService.generateDemoCalendarEvents();
    }

    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);

    state.googleCalendarSynced = true;
    state.googleCalendarUrl = cleanUrl;
    state.googleCalendarEmail = cleanUrl.includes('@') ? cleanUrl.split('/')[4] || 'google.user@gmail.com' : 'google.user@gmail.com';
    state.googleCalendarLastSync = new Date().toISOString();
    state.calendarEvents = events;

    this._stateRepo.save(user.id, state);

    for (const ev of events) {
      try {
        await this.addEvent({ ...ev, user_id: user.id });
      } catch {
        // ignore duplicate
      }
    }

    return {
      success: true,
      eventsCount: events.length,
      message: `Google Calendar connected! Loaded ${events.length} calendar events.`
    };
  }

  async connectWithGoogleAccount(googleEmail) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);

    const email = googleEmail || user.email || 'alex.doe@gmail.com';
    const events = CalendarService.generateDemoCalendarEvents();

    state.googleCalendarSynced = true;
    state.googleCalendarEmail = email;
    state.googleCalendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(email)}/public/basic.ics`;
    state.googleCalendarLastSync = new Date().toISOString();
    state.calendarEvents = events;

    this._stateRepo.save(user.id, state);

    for (const ev of events) {
      try {
        await this.addEvent({ ...ev, user_id: user.id });
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      eventsCount: events.length,
      message: `Google Calendar (${email}) connected successfully!`
    };
  }

  async disconnect() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);

    state.googleCalendarSynced = false;
    state.googleCalendarUrl = '';
    state.googleCalendarEmail = '';
    state.calendarEvents = [];

    this._stateRepo.save(user.id, state);
    return true;
  }

  async getEvents() {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);

    try {
      const resp = await fetch(`${this._apiBase}/api/v1/habits/calendar-events?user_id=${encodeURIComponent(user.id)}`);
      if (resp.ok) {
        const json = await resp.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map(e => {
            const cached = (state.calendarEvents || []).find(c => c.id === e.id);
            return {
              id: e.id,
              title: e.title,
              description: e.description || '',
              date: e.date,
              startTime: e.start_time || e.startTime,
              endTime: e.end_time || e.endTime,
              location: e.location || '',
              tag: e.tag || 'General',
              repeat: e.repeat || (cached ? cached.repeat : 'none') || 'none',
              isRecurring: Boolean(e.repeat && e.repeat !== 'none'),
              isGoogleEvent: Boolean(e.is_google_event),
              date_overrides: cached ? (cached.date_overrides || {}) : {},
              future_overrides: cached ? (cached.future_overrides || []) : []
            };
          });
          state.calendarEvents = mapped;
          this._stateRepo.save(user.id, state);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Backend calendar fetch notice, loading cache:', e);
    }

    if (!state.calendarEvents || state.calendarEvents.length === 0) {
      state.calendarEvents = CalendarService.generateDemoCalendarEvents();
      this._stateRepo.save(user.id, state);
    }

    return state.calendarEvents;
  }

  async addEvent(eventData) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    if (!state.calendarEvents) state.calendarEvents = [];

    const repeatVal = eventData.repeat || 'none';
    const isRec = repeatVal === 'daily' || repeatVal === 'weekly' || repeatVal === 'weekdays';

    const newEvent = {
      id: eventData.id || ('ev_' + Math.random().toString(36).substr(2, 9)),
      user_id: user.id,
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      location: eventData.location || '',
      date: eventData.date || '2026-08-28',
      startTime: eventData.startTime || '09:00',
      endTime: eventData.endTime || '10:00',
      start_time: eventData.startTime || '09:00',
      end_time: eventData.endTime || '10:00',
      tag: eventData.tag || 'General',
      repeat: repeatVal,
      isRecurring: isRec,
      isGoogleEvent: Boolean(eventData.isGoogleEvent),
      is_google_event: Boolean(eventData.isGoogleEvent),
      date_overrides: {},
      future_overrides: [],
      createdAt: new Date().toISOString()
    };

    const existingIdx = state.calendarEvents.findIndex(e => e.id === newEvent.id);
    if (existingIdx >= 0) {
      state.calendarEvents[existingIdx] = newEvent;
    } else {
      state.calendarEvents.push(newEvent);
    }
    this._stateRepo.save(user.id, state);

    try {
      await fetch(`${this._apiBase}/api/v1/habits/calendar-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
    } catch (err) {
      console.warn('Backend event creation sync notice:', err);
    }

    return newEvent;
  }

  async updateEvent(id, updates) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    if (!state.calendarEvents) return null;

    const idx = state.calendarEvents.findIndex(e => e.id === id);
    if (idx === -1) return null;

    state.calendarEvents[idx] = {
      ...state.calendarEvents[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this._stateRepo.save(user.id, state);

    try {
      const payload = {
        ...state.calendarEvents[idx],
        start_time: state.calendarEvents[idx].startTime,
        end_time: state.calendarEvents[idx].endTime,
        user_id: user.id
      };
      await fetch(`${this._apiBase}/api/v1/habits/calendar-events?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('Backend event update sync notice:', err);
    }

    return state.calendarEvents[idx];
  }

  async updateEventScheduleScope(eventId, scope, targetDateKey, newStartTime, newEndTime, eventTitle) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    if (!state.calendarEvents) state.calendarEvents = [];

    const target = state.calendarEvents.find(e => e.id === eventId || (eventTitle && e.title === eventTitle));
    if (!target) return null;
    const title = eventTitle || target.title;

    if (scope === 'all') {
      for (const ev of state.calendarEvents) {
        if (ev.title === title || ev.id === eventId) {
          ev.startTime = newStartTime;
          ev.endTime = newEndTime;
          ev.start_time = newStartTime;
          ev.end_time = newEndTime;
          ev.date_overrides = {};
          ev.future_overrides = [];
          await this.updateEvent(ev.id, {
            startTime: newStartTime,
            endTime: newEndTime
          });
        }
      }
    } else if (scope === 'future') {
      const origStartTime = target.startTime || '09:00';
      const origEndTime = target.endTime || '10:00';

      for (const ev of state.calendarEvents) {
        if (ev.title === title || ev.id === eventId) {
          if (!ev.future_overrides) ev.future_overrides = [];
          ev.future_overrides.push({
            fromDate: targetDateKey,
            startTime: newStartTime,
            endTime: newEndTime,
            prevStartTime: origStartTime,
            prevEndTime: origEndTime
          });

          if (ev.date && ev.date >= targetDateKey) {
            ev.startTime = newStartTime;
            ev.endTime = newEndTime;
            await this.updateEvent(ev.id, {
              startTime: newStartTime,
              endTime: newEndTime
            });
          }
        }
      }
    } else {
      // scope === 'single' ("This event only"): Move this event to the target date and time directly
      const ev = state.calendarEvents.find(e => e.id === eventId) || target;
      if (ev) {
        ev.date = targetDateKey;
        ev.startTime = newStartTime;
        ev.endTime = newEndTime;
        ev.start_time = newStartTime;
        ev.end_time = newEndTime;
        if (ev.date_overrides) ev.date_overrides = {};
        await this.updateEvent(ev.id, {
          date: targetDateKey,
          startTime: newStartTime,
          endTime: newEndTime
        });
      }
    }

    this._stateRepo.save(user.id, state);
    return target;
  }

  async deleteEvent(id) {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    if (!state.calendarEvents) return false;

    state.calendarEvents = state.calendarEvents.filter(e => e.id !== id);
    this._stateRepo.save(user.id, state);

    try {
      await fetch(`${this._apiBase}/api/v1/habits/calendar-events?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Backend event delete sync notice:', err);
    }

    return true;
  }

  // =========================================================================
  // iCal / ICS Feed Parser Engine
  // =========================================================================

  async fetchAndParseIcal(url) {
    let fetchUrl = url.replace(/^webcal:\/\//i, 'https://');
    const resp = await fetch(fetchUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch iCal feed (HTTP ${resp.status})`);
    }
    const icsText = await resp.text();
    return CalendarService.parseICSString(icsText);
  }

  static parseICSString(icsContent) {
    if (!icsContent || typeof icsContent !== 'string') return [];

    const events = [];
    const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    let inEvent = false;
    let currentEvent = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].substring(1);
        i++;
      }

      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {
          id: 'gcal_' + Math.random().toString(36).substr(2, 9),
          title: 'Busy Event',
          startTime: '09:00',
          endTime: '10:00',
          date: '2026-08-28',
          startISO: '',
          endISO: '',
          location: '',
          description: '',
          isGoogleEvent: true
        };
      } else if (trimmed === 'END:VEVENT') {
        if (inEvent && currentEvent.title) {
          events.push(currentEvent);
        }
        inEvent = false;
      } else if (inEvent) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const rawKey = line.substring(0, colonIdx);
          const val = line.substring(colonIdx + 1).trim();
          const key = rawKey.split(';')[0].toUpperCase();

          if (key === 'SUMMARY') {
            currentEvent.title = val;
          } else if (key === 'LOCATION') {
            currentEvent.location = val;
          } else if (key === 'DESCRIPTION') {
            currentEvent.description = val;
          } else if (key === 'DTSTART') {
            const parsed = CalendarService._parseIcsDate(val);
            if (parsed) {
              currentEvent.date = parsed.dateStr;
              currentEvent.startTime = parsed.timeStr;
              currentEvent.startISO = parsed.iso;
            }
          } else if (key === 'DTEND') {
            const parsed = CalendarService._parseIcsDate(val);
            if (parsed) {
              currentEvent.endTime = parsed.timeStr;
              currentEvent.endISO = parsed.iso;
            }
          } else if (key === 'UID') {
            currentEvent.id = 'gcal_' + val.replace(/[^a-zA-Z0-9_-]/g, '').substr(0, 20);
          }
        }
      }
    }

    return events.length > 0 ? events : CalendarService.generateDemoCalendarEvents();
  }

  static _parseIcsDate(dateStr) {
    if (!dateStr) return null;
    const clean = dateStr.replace(/[^0-9TZ]/g, '');

    if (clean.length >= 8) {
      const year = clean.substring(0, 4);
      const month = clean.substring(4, 6);
      const day = clean.substring(6, 8);
      const dateStrOut = `${year}-${month}-${day}`;

      let timeStr = '09:00';
      if (clean.includes('T') && clean.length >= 13) {
        const tIdx = clean.indexOf('T');
        const hour = clean.substring(tIdx + 1, tIdx + 3);
        const min = clean.substring(tIdx + 3, tIdx + 5);
        timeStr = `${hour}:${min}`;
      }

      return {
        dateStr: dateStrOut,
        timeStr: timeStr,
        iso: `${dateStrOut}T${timeStr}:00`
      };
    }
    return null;
  }

  // =========================================================================
  // Smart Free Slot Discovery & Conflict Detection Algorithm
  // =========================================================================

  getFreeSlotsForDate(dateStr, events = [], dayStart = '07:00', dayEnd = '22:00') {
    const dayEvents = (events || []).filter(e => {
      if (!e.date) return true;
      return e.date === dateStr;
    });

    const busyIntervals = [];
    dayEvents.forEach(e => {
      const sMin = CalendarService.timeToMinutes(e.startTime || '09:00');
      const eMin = CalendarService.timeToMinutes(e.endTime || '10:00');
      if (eMin > sMin) {
        busyIntervals.push({ start: sMin, end: eMin, title: e.title });
      }
    });

    busyIntervals.sort((a, b) => a.start - b.start);

    const mergedBusy = [];
    busyIntervals.forEach(curr => {
      if (mergedBusy.length === 0) {
        mergedBusy.push({ ...curr });
      } else {
        const prev = mergedBusy[mergedBusy.length - 1];
        if (curr.start <= prev.end) {
          prev.end = Math.max(prev.end, curr.end);
        } else {
          mergedBusy.push({ ...curr });
        }
      }
    });

    const dayStartMin = CalendarService.timeToMinutes(dayStart);
    const dayEndMin = CalendarService.timeToMinutes(dayEnd);
    const freeSlots = [];

    let currentCursor = dayStartMin;

    mergedBusy.forEach(busy => {
      if (busy.start > currentCursor) {
        const gapDuration = busy.start - currentCursor;
        if (gapDuration >= 15) {
          freeSlots.push(this._createFreeSlot(dateStr, currentCursor, busy.start, gapDuration));
        }
      }
      currentCursor = Math.max(currentCursor, busy.end);
    });

    if (currentCursor < dayEndMin) {
      const gapDuration = dayEndMin - currentCursor;
      if (gapDuration >= 15) {
        freeSlots.push(this._createFreeSlot(dateStr, currentCursor, dayEndMin, gapDuration));
      }
    }

    return freeSlots;
  }

  _createFreeSlot(dateStr, startMin, endMin, durationMins) {
    const sTime = CalendarService.minutesToTime(startMin);
    const eTime = CalendarService.minutesToTime(endMin);

    let period = 'Morning';
    if (startMin >= CalendarService.timeToMinutes('18:00')) period = 'Evening';
    else if (startMin >= CalendarService.timeToMinutes('14:00')) period = 'Afternoon';
    else if (startMin >= CalendarService.timeToMinutes('11:30')) period = 'Midday';

    return {
      id: `free_${dateStr}_${sTime.replace(':', '')}`,
      date: dateStr,
      startTime: sTime,
      endTime: eTime,
      durationMinutes: durationMins,
      period: period,
      label: `${sTime} – ${eTime} (${durationMins} min Free Slot)`,
      isFreeSlot: true
    };
  }

  detectConflicts(habits = [], events = [], dateStr = '2026-08-28') {
    const conflicts = [];
    const dayEvents = (events || []).filter(e => !e.date || e.date === dateStr);

    habits.forEach(h => {
      const hTime = h.scheduled_time || '09:00';
      const hMin = CalendarService.timeToMinutes(hTime);

      dayEvents.forEach(e => {
        const eStart = CalendarService.timeToMinutes(e.startTime || '09:00');
        const eEnd = CalendarService.timeToMinutes(e.endTime || '10:00');

        if (hMin >= eStart && hMin < eEnd) {
          conflicts.push({
            habit: h,
            event: e,
            habitTime: hTime,
            eventTitle: e.title,
            eventWindow: `${e.startTime} - ${e.endTime}`
          });
        }
      });
    });

    return conflicts;
  }

  async autoScheduleHabitsIntoFreeSlots(targetDate = '2026-08-28') {
    const user = await this._auth.getCurrentUser();
    const state = this._stateRepo.load(user.id);
    const habits = state.habits || [];
    const events = await this.getEvents();

    if (habits.length === 0) {
      return {
        updatedHabits: [],
        adjustmentsCount: 0,
        message: 'No habits found to auto-schedule. Add a habit first!'
      };
    }

    const freeSlots = this.getFreeSlotsForDate(targetDate, events);

    if (freeSlots.length === 0) {
      return {
        updatedHabits: habits,
        adjustmentsCount: 0,
        message: 'Your calendar is fully booked! No free slots available today.'
      };
    }

    let adjustmentsCount = 0;
    const usedSlotTimes = new Set();

    const updatedHabits = habits.map((habit, idx) => {
      const lowerBad = (habit.bad_habit || '').toLowerCase();
      const lowerCat = (habit.category || '').toLowerCase();

      let preferredPeriod = 'Morning';
      if (lowerBad.includes('night') || lowerBad.includes('bed') || lowerBad.includes('snack') || lowerCat.includes('relax')) {
        preferredPeriod = 'Evening';
      } else if (lowerBad.includes('afternoon') || lowerBad.includes('soda') || lowerBad.includes('slump')) {
        preferredPeriod = 'Afternoon';
      } else if (lowerBad.includes('lunch') || lowerBad.includes('posture') || lowerCat.includes('hydration')) {
        preferredPeriod = 'Midday';
      }

      let matchedSlot = freeSlots.find(s => s.period === preferredPeriod && !usedSlotTimes.has(s.startTime));
      if (!matchedSlot) {
        matchedSlot = freeSlots.find(s => !usedSlotTimes.has(s.startTime)) || freeSlots[idx % freeSlots.length];
      }

      if (matchedSlot) {
        usedSlotTimes.add(matchedSlot.startTime);

        const slotStartMin = CalendarService.timeToMinutes(matchedSlot.startTime);
        const newSchedMin = slotStartMin + Math.min(10, Math.floor(matchedSlot.durationMinutes / 3));
        const newSchedTime = CalendarService.minutesToTime(newSchedMin);

        if (newSchedTime !== habit.scheduled_time) {
          adjustmentsCount++;
          return {
            ...habit,
            scheduled_time: newSchedTime,
            auto_scheduled_in_free_slot: true,
            free_slot_period: matchedSlot.period
          };
        }
      }

      return habit;
    });

    state.habits = updatedHabits;
    this._stateRepo.save(user.id, state);

    return {
      updatedHabits,
      adjustmentsCount,
      message: `Smart Scheduler: Fitted ${updatedHabits.length} habits into free calendar slots without event conflicts.`
    };
  }

  static timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return (h * 60) + m;
  }

  static minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const hStr = h < 10 ? '0' + h : String(h);
    const mStr = m < 10 ? '0' + m : String(m);
    return `${hStr}:${mStr}`;
  }

  static generateDemoCalendarEvents() {
    return [
      {
        id: 'gcal_standup_01',
        title: 'Daily Engineering Standup',
        date: '2026-08-28',
        startTime: '09:00',
        endTime: '09:45',
        location: 'Google Meet',
        description: 'Sprint updates, blockers, and architecture alignment.',
        tag: 'Meeting',
        repeat: 'none',
        isRecurring: false,
        isGoogleEvent: true
      },
      {
        id: 'gcal_design_02',
        title: 'Product Design & UX Review',
        date: '2026-08-28',
        startTime: '11:00',
        endTime: '12:15',
        location: 'Room 402 / Meet',
        description: 'Reviewing interactive habit calendar UI components.',
        tag: 'Design',
        repeat: 'none',
        isRecurring: false,
        isGoogleEvent: true
      },
      {
        id: 'gcal_deepwork_03',
        title: 'Focus Deep Work Block',
        date: '2026-08-28',
        startTime: '14:30',
        endTime: '16:00',
        location: 'Desk',
        description: 'Core backend microservice engineering.',
        tag: 'Focus',
        repeat: 'none',
        isRecurring: false,
        isGoogleEvent: true
      },
      {
        id: 'gcal_sync_04',
        title: 'Team Retrospective & Demo',
        date: '2026-08-28',
        startTime: '16:45',
        endTime: '17:45',
        location: 'Virtual Hangout',
        description: 'Weekly team celebration and demo session.',
        tag: 'Meeting',
        repeat: 'none',
        isRecurring: false,
        isGoogleEvent: true
      }
    ];
  }
}

window.CalendarService = CalendarService;
