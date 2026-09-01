class UserStateRepository {
  constructor(storage) {
    this._storage = storage;
  }

  load(userId) {
    if (!userId) userId = 'usr_demo';
    const key = UserStateRepository._key(userId);
    const saved = this._storage.getJSON(key, null);
    if (saved) return saved;

    const initialState = UserStateRepository.createFreshState();
    this._storage.setJSON(key, initialState);
    return initialState;
  }

  save(userId, state) {
    if (!userId) userId = 'usr_demo';
    this._storage.setJSON(UserStateRepository._key(userId), state);
  }

  clear(userId) {
    if (!userId) userId = 'usr_demo';
    this._storage.remove(UserStateRepository._key(userId));
  }

  static _key(userId) {
    return `habitizer_user_state_${userId}`;
  }

  static createFreshState() {
    return {
      habits: [],
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
        total_screen_time_earned_mins: 60
      },
      checkins: {},
      googleCalendarSynced: true,
      googleCalendarUrl: 'https://calendar.google.com/calendar/ical/demo.alex%40gmail.com/public/basic.ics',
      googleCalendarEmail: 'demo.alex@gmail.com',
      googleCalendarLastSync: '2026-08-28T08:00:00.000Z',
      calendarEvents: [
        { id: 'gcal_standup_01', title: 'Daily Engineering Standup', date: '2026-08-28', repeat: 'weekdays', startTime: '09:00', endTime: '09:45', location: 'Google Meet', isGoogleEvent: true },
        { id: 'gcal_design_02', title: 'Product Design & UX Review', date: '2026-08-28', repeat: 'weekdays', startTime: '11:00', endTime: '12:15', location: 'Room 402 / Meet', isGoogleEvent: true },
        { id: 'gcal_deepwork_03', title: 'Focus Deep Work Block', date: '2026-08-28', repeat: 'weekdays', startTime: '14:30', endTime: '16:00', location: 'Desk', isGoogleEvent: true }
      ]
    };
  }
}

window.UserStateRepository = UserStateRepository;
