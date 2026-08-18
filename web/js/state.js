// Centralized Application State Management (Reactive Store with Pub/Sub)

class StateStore {
  constructor() {
    this.listeners = [];
    this.state = {
      userTier: "free", // "free" (max 3 active habits) or "premium" (unlimited)
      currentDate: new Date(2026, 6, 25), // July 25, 2026
      calendarViewMode: "month", // "month", "week", "3day", "day"
      habits: [
        {
          id: "hbt_junkfood",
          bad_habit: "Late night junk food snacking",
          frequency: "daily",
          scheduled_time: "23:00",
          cue_trigger: "Boredom or stress at 11 PM",
          replacement_habit: "Drink hot chamomile tea",
          reward: "Relaxed feeling and good sleep",
          category: "Health"
        },
        {
          id: "hbt_socialmedia",
          bad_habit: "Excessive social media scrolling",
          frequency: "daily",
          scheduled_time: "08:00",
          cue_trigger: "Waking up in the morning",
          replacement_habit: "Read 5 pages of a book",
          reward: "Clear focus for the day",
          category: "Productivity"
        }
      ],
      suggestions: [
        { id: "s1", category: "Mindfulness", title: "5-Minute Deep Breathing", description: "Take slow deep breaths to regulate stress triggers", icon_name: "self_improvement" },
        { id: "s2", category: "Hydration", title: "Drink a Glass of Water", description: "Hydrate immediately when craving hits", icon_name: "local_drink" },
        { id: "s3", category: "Physical Action", title: "Do 10 Push-ups or Stretch", description: "Channel energy into light exercise", icon_name: "fitness_center" },
        { id: "s4", category: "Focus & Learning", title: "Read 5 Pages of a Book", description: "Engage your mind with reading", icon_name: "menu_book" },
        { id: "s5", category: "Relaxation", title: "Listen to a Calming Song", description: "Divert emotional triggers with audio", icon_name: "headset" }
      ],
      economy: {
        currency_balance: 150,
        streak_freezes_available: 2,
        total_screen_time_earned_mins: 60
      },
      streaks: {
        total_streaks: 14,
        longest_streak: 18,
        overall_success_rate: 93.3
      },
      customReplacementCounts: {}
    };
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(eventKey, data) {
    this.listeners.forEach(listener => listener(eventKey, data, this.state));
  }

  setUserTier(tier) {
    this.state.userTier = tier;
    this.notify("USER_TIER_CHANGED", tier);
  }

  setCalendarViewMode(mode) {
    this.state.calendarViewMode = mode;
    this.notify("CALENDAR_VIEW_CHANGED", mode);
  }

  setCurrentDate(date) {
    this.state.currentDate = date;
    this.notify("DATE_CHANGED", date);
  }

  setHabits(habits) {
    this.state.habits = habits;
    this.notify("HABITS_UPDATED", habits);
  }

  addHabit(habit) {
    this.state.habits.push(habit);
    this.notify("HABIT_ADDED", habit);
  }

  removeHabit(habitId) {
    this.state.habits = this.state.habits.filter(h => h.id !== habitId);
    this.notify("HABIT_REMOVED", habitId);
  }

  updateEconomy(balanceDelta, freezesDelta, screenTimeDelta) {
    if (balanceDelta !== undefined) this.state.economy.currency_balance += balanceDelta;
    if (freezesDelta !== undefined) this.state.economy.streak_freezes_available += freezesDelta;
    if (screenTimeDelta !== undefined) this.state.economy.total_screen_time_earned_mins += screenTimeDelta;
    this.notify("ECONOMY_UPDATED", this.state.economy);
  }

  updateStreak(streakDelta) {
    if (streakDelta === 0) {
      this.state.streaks.total_streaks = 0;
    } else {
      this.state.streaks.total_streaks += streakDelta;
    }
    this.notify("STREAK_UPDATED", this.state.streaks);
  }
}

export const store = new StateStore();
