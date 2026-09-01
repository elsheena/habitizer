/**
 * CalendarMonthViewComponent — Month Calendar View Builder.
 * Single Responsibility: Build and render the 7x5 month grid matrix with day chips and jump navigation.
 */
class CalendarMonthViewComponent extends UIComponent {
  /**
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onDayClicked]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
    this.weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  buildMonthView(year, month, events, habits, isSynced, isTodayFn) {
    const grid = this.createElement('div', { className: 'calendar-grid' });

    // Weekday Header Row
    this.weekdayNames.forEach(name => {
      const headerCell = this.createElement('div', {
        className: 'calendar-day-header',
        children: [this.createElement('span', { text: name })]
      });
      grid.appendChild(headerCell);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const firstDay = (firstDayIndex + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(d) });
      const cell = this.createElement('div', {
        className: ['calendar-cell', 'other-month'],
        children: [this.createElement('div', { className: 'cell-header', children: [numSpan] })],
        attrs: { style: 'cursor: pointer;' },
        events: { click: () => this.callbacks.onDayClicked && this.callbacks.onDayClicked(prevDate.getFullYear(), prevDate.getMonth(), d) }
      });
      grid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isTodayFn ? isTodayFn(year, month, day) : false;
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(day) });
      const headerChildren = [numSpan];
      if (isToday) {
        headerChildren.push(this.createElement('span', { className: 'badge-today-pill', text: 'Today' }));
      }
      const headerDiv = this.createElement('div', { className: 'cell-header', children: headerChildren });
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const chips = this._buildChipsForDay(dStr, events, habits, isSynced);
      const chipsDiv = this.createElement('div', { className: 'habit-chips-container', children: chips });

      const cell = this.createElement('div', {
        className: ['calendar-cell', isToday ? 'today' : ''],
        children: [headerDiv, chipsDiv],
        attrs: { style: 'cursor: pointer;' },
        events: { click: () => this.callbacks.onDayClicked && this.callbacks.onDayClicked(year, month, day) }
      });
      grid.appendChild(cell);
    }

    // Next month filler
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(i) });
      const cell = this.createElement('div', {
        className: ['calendar-cell', 'other-month'],
        children: [this.createElement('div', { className: 'cell-header', children: [numSpan] })],
        attrs: { style: 'cursor: pointer;' },
        events: { click: () => this.callbacks.onDayClicked && this.callbacks.onDayClicked(nextDate.getFullYear(), nextDate.getMonth(), i) }
      });
      grid.appendChild(cell);
    }

    return grid;
  }

  _buildChipsForDay(dateKey, events, habits, isSynced) {
    const chips = [];
    const dayEvents = (events || []).filter(e => !e.date || e.date === dateKey);

    if (isSynced && dayEvents.length > 0) {
      const count = dayEvents.length;
      chips.push(this.createElement('div', {
        className: ['habit-chip', 'chip-google'],
        children: [
          this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'google', 'data-size': '12' } }),
          this.createElement('span', { className: 'chip-text', text: `${count} Event${count > 1 ? 's' : ''}` })
        ]
      }));
    }

    if (habits && habits.length > 0) {
      habits.slice(0, 2).forEach(h => {
        const title = h.replacement_habit || h.bad_habit || "Healthy Routine";
        chips.push(this.createElement('div', {
          className: ['habit-chip', 'chip-substituted'],
          children: [
            this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'check', 'data-size': '12' } }),
            this.createElement('span', { className: 'chip-text', text: title })
          ]
        }));
      });
    }

    return chips;
  }
}

window.CalendarMonthViewComponent = CalendarMonthViewComponent;
