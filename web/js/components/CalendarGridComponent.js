/**
 * CalendarGridComponent — UI Component for interactive habit calendar.
 * Single Responsibility: Build month/week/3-day/day grids, day cells, habit chips, and details modal via DOM APIs.
 */
class CalendarGridComponent extends UIComponent {
  /**
   * @param {Object} [options]
   * @param {number} [options.systemYear=2026]
   * @param {number} [options.systemMonth=7]
   * @param {number} [options.systemDay=28]
   */
  constructor(options = {}) {
    super();
    this.systemYear = options.systemYear || 2026;
    this.systemMonth = options.systemMonth !== undefined ? options.systemMonth : 7; // August
    this.systemDay = options.systemDay || 28;

    this.currentDate = new Date(this.systemYear, this.systemMonth, 1);
    this.currentView = 'month'; // 'month', 'week', '3day', 'day'
    this.habits = [];
    this.user = { id: '', full_name: 'Alex', is_mock: false };

    this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  /**
   * Set active data and re-render.
   * @param {Object} user
   * @param {Array<Object>} habits
   */
  setData(user, habits) {
    this.user = user;
    this.habits = habits || [];
    this.render();
  }

  render() {
    this._updateTitle();
    const container = document.getElementById('calendar-view-container') || document.getElementById('calendar-grid-wrapper');
    if (!container) return;

    container.innerHTML = '';

    let viewElement;
    if (this.currentView === 'month') {
      viewElement = this._buildMonthView();
    } else if (this.currentView === 'week') {
      viewElement = this._buildMultiDayView(7);
    } else if (this.currentView === '3day') {
      viewElement = this._buildMultiDayView(3);
    } else {
      viewElement = this._buildMultiDayView(1);
    }

    container.appendChild(viewElement);
    if (window.Icons) window.Icons.renderAll();
  }

  _updateTitle() {
    const titleEl = document.getElementById('cal-month-title') || document.getElementById('calendar-month-year');
    if (!titleEl) return;
    const m = this.monthNames[this.currentDate.getMonth()];
    const y = this.currentDate.getFullYear();

    if (this.currentView === 'month') {
      titleEl.textContent = `${m} ${y}`;
    } else if (this.currentView === 'day') {
      titleEl.textContent = `${m} ${this.systemDay}, ${y}`;
    } else if (this.currentView === 'week') {
      titleEl.textContent = `${m} ${y} (Week View)`;
    } else {
      titleEl.textContent = `${m} ${y} (3-Day View)`;
    }
  }

  _buildMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = this.createElement('div', { className: 'calendar-grid' });

    // Weekday headers
    this.weekdayNames.forEach(d => {
      grid.appendChild(this.createElement('div', { className: 'calendar-day-header', text: d }));
    });

    // Previous month trailing cells
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(d) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', { className: ['calendar-cell', 'other-month'], children: [headerDiv] }));
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = (year === this.systemYear && month === this.systemMonth && day === this.systemDay);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(day) });
      const headerChildren = [numSpan];

      if (isToday) {
        headerChildren.push(this.createElement('span', {
          className: ['badge', 'badge-success', 'badge-today-pill'],
          text: 'TODAY'
        }));
      }

      const cellHeader = this.createElement('div', {
        className: 'cell-header',
        children: headerChildren
      });

      const chipsContainer = this.createElement('div', {
        className: 'habit-chips-container',
        children: this._buildChipsForDay(year, month, day)
      });

      const cell = this.createElement('div', {
        className: ['calendar-cell', isToday ? 'today' : ''],
        attrs: { 'data-day': day, 'data-month': month, 'data-year': year, 'data-date': dateKey },
        children: [cellHeader, chipsContainer],
        events: {
          click: () => this.openDayModal(day, month, year, dateKey)
        }
      });

      grid.appendChild(cell);
    }

    // Next month filler cells
    const totalRendered = firstDay + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(i) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', { className: ['calendar-cell', 'other-month'], children: [headerDiv] }));
    }

    return grid;
  }

  _buildMultiDayView(numDays) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDay = Math.min(Math.max(1, this.systemDay - numDays + 1), daysInMonth - numDays + 1);

    const container = this.createElement('div', {
      className: `calendar-multiday-grid col-${numDays}`
    });

    for (let i = 0; i < numDays; i++) {
      const dNum = startDay + i;
      const isToday = (year === this.systemYear && month === this.systemMonth && dNum === this.systemDay);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, dNum).getDay();

      const dowDiv = this.createElement('div', {
        className: 'multiday-dow-label',
        text: this.weekdayNames[dayOfWeek]
      });

      const numDiv = this.createElement('div', {
        className: 'cell-day-num multiday-day-num',
        text: `${dNum} ${this.monthNames[month].substring(0, 3)}`
      });

      const headerCol = this.createElement('div', { children: [dowDiv, numDiv] });
      const headerChildren = [headerCol];

      if (isToday) {
        headerChildren.push(this.createElement('span', {
          className: ['badge', 'badge-success', 'badge-today-pill'],
          text: 'TODAY'
        }));
      }

      const cellHeader = this.createElement('div', {
        className: 'cell-header multiday-cell-header',
        children: headerChildren
      });

      const eventsContainer = this.createElement('div', {
        className: 'habit-chips-container multiday-chips-container',
        children: this._buildDetailedEventsForDay(year, month, dNum)
      });

      const cell = this.createElement('div', {
        className: ['calendar-cell', 'multiday-cell', isToday ? 'today' : ''],
        attrs: { 'data-day': dNum, 'data-month': month, 'data-year': year, 'data-date': dateKey },
        children: [cellHeader, eventsContainer],
        events: {
          click: () => this.openDayModal(dNum, month, year, dateKey)
        }
      });

      container.appendChild(cell);
    }

    return container;
  }

  _buildChipsForDay(year, month, day) {
    if (year !== this.systemYear || month !== this.systemMonth) return [];
    if (day > this.systemDay) return [];

    const primaryHabit = (this.habits && this.habits[0]) || {
      replacement_habit: 'Sparkling lime water',
      bad_habit: 'Afternoon sugary soda'
    };

    if (day === this.systemDay) {
      const checkIcon = this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'check', 'data-size': '12' } });
      const textSpan1 = this.createElement('span', { className: 'chip-text', text: primaryHabit.replacement_habit || 'Substituted' });
      const chip1 = this.createElement('span', {
        className: ['habit-chip', 'chip-substituted'],
        attrs: { title: primaryHabit.bad_habit || 'Substituted habit' },
        children: [checkIcon, textSpan1]
      });

      const clockIcon = this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'clock', 'data-size': '12' } });
      const textSpan2 = this.createElement('span', { className: 'chip-text', text: '21:00 Audit' });
      const chip2 = this.createElement('span', {
        className: ['habit-chip', 'chip-scheduled'],
        children: [clockIcon, textSpan2]
      });
      return [chip1, chip2];
    } else if (day === 12 || day === 20) {
      const freezeIcon = this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'snowflake', 'data-size': '12' } });
      const textSpan = this.createElement('span', { className: 'chip-text', text: 'Freeze Used' });
      return [this.createElement('span', {
        className: ['habit-chip', 'chip-freeze'],
        attrs: { title: 'Streak freeze protected' },
        children: [freezeIcon, textSpan]
      })];
    } else {
      const checkIcon = this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'check', 'data-size': '12' } });
      const textSpan = this.createElement('span', { className: 'chip-text', text: primaryHabit.replacement_habit || 'Substituted' });
      return [this.createElement('span', {
        className: ['habit-chip', 'chip-substituted'],
        attrs: { title: 'Daily clean substitution completed' },
        children: [checkIcon, textSpan]
      })];
    }
  }

  _buildDetailedEventsForDay(year, month, day) {
    if (year === this.systemYear && month === this.systemMonth && day > this.systemDay) {
      return [this.createElement('div', {
        className: 'empty-events-notice',
        text: 'Upcoming date — No log yet'
      })];
    }

    const primaryHabit = (this.habits && this.habits[0]) || {
      replacement_habit: 'Sparkling lime water',
      bad_habit: 'Afternoon sugary soda'
    };

    if (day === 12 || day === 20) {
      const freezeTag = this.createElement('div', {
        className: 'event-title-amber',
        text: 'FREEZE APPLIED'
      });
      const habitTitle = this.createElement('div', {
        className: 'event-body-title',
        text: 'Streak Protected with Freeze'
      });
      const habitDesc = this.createElement('div', {
        className: 'event-body-subtext',
        text: 'Clean streak preserved automatically.'
      });
      return [this.createElement('div', {
        className: 'event-card-amber',
        children: [freezeTag, habitTitle, habitDesc]
      })];
    }

    const card1 = this.createElement('div', {
      className: 'event-card-emerald',
      children: [
        this.createElement('div', { className: 'event-title-emerald', text: `SUBSTITUTED (${primaryHabit.scheduled_time || '15:00'})` }),
        this.createElement('div', { className: 'event-body-title', text: primaryHabit.replacement_habit || 'Sparkling lime water' }),
        this.createElement('div', { className: 'event-body-subtext', text: `Avoided: ${primaryHabit.bad_habit || 'Afternoon sugary soda'}` })
      ]
    });

    const card2 = this.createElement('div', {
      className: 'event-card-indigo',
      children: [
        this.createElement('div', { className: 'event-title-indigo', text: 'SCHEDULED (21:00)' }),
        this.createElement('div', { className: 'event-body-title', text: 'Evening Check-In & Audit' }),
        this.createElement('div', { className: 'event-body-subtext', text: '+10 Coins awarded on audit completion' })
      ]
    });

    return [card1, card2];
  }

  openDayModal(day, month, year, dateKey) {
    const modal = document.getElementById('calendar-detail-modal') || document.getElementById('habit-modal');
    const modalTitle = document.getElementById('modal-habit-date') || document.getElementById('modal-habit-title');
    const modalContent = document.getElementById('modal-habit-content');
    if (!modal || !modalTitle || !modalContent) return;

    const mName = this.monthNames[month] || "Month";
    modalTitle.textContent = `Daily Habit Log — ${mName} ${day}, ${year}`;
    modalContent.innerHTML = '';

    const d = parseInt(day, 10);
    const isFuture = (year > this.systemYear) || (year === this.systemYear && month > this.systemMonth) || (year === this.systemYear && month === this.systemMonth && d > this.systemDay);
    const isMock = this.user.id === 'usr_demo_88' || Boolean(this.user.is_mock);

    if (!isMock) {
      if (isFuture) {
        modalContent.appendChild(this.createElement('p', {
          className: 'modal-future-notice',
          text: 'Future date. Scheduled routine reminders will trigger automatically.'
        }));
      } else if (this.habits.length === 0) {
        const notice = this.createElement('p', {
          className: 'modal-empty-notice',
          text: 'No habits created yet. Build your first substitution loop to track progress!'
        });
        const addBtn = this.createElement('a', {
          className: ['btn', 'btn-primary', 'btn-sm'],
          attrs: { href: '/create' },
          text: 'Add New Habit'
        });
        const wrap = this.createElement('div', {
          className: 'modal-empty-wrapper',
          children: [notice, addBtn]
        });
        modalContent.appendChild(wrap);
      } else {
        this.habits.forEach(h => {
          const badge = this.createElement('span', { className: ['badge', 'badge-success'], text: 'Active Routine' });
          const time = this.createElement('span', { className: 'modal-time-label', text: h.scheduled_time || '09:00' });
          const head = this.createElement('div', { className: 'modal-item-header', children: [badge, time] });

          const title = this.createElement('h4', { className: 'modal-habit-title-sm', text: h.bad_habit });
          const rep = this.createElement('p', { className: 'modal-rep-text', text: `Replacement: ${h.replacement_habit}` });

          const card = this.createElement('div', {
            className: ['card-static', 'card-padded', 'modal-item-card'],
            children: [head, title, rep]
          });
          modalContent.appendChild(card);
        });
      }
    } else {
      // Mock demo data
      if (isFuture) {
        modalContent.appendChild(this.createElement('p', {
          className: 'modal-future-notice',
          text: 'Future date. Scheduled routine reminders will trigger automatically.'
        }));
      } else if ((month === this.systemMonth) && (d === 12 || d === 20)) {
        const fTitle = this.createElement('div', { className: 'modal-freeze-title', text: 'Streak Freeze Activated' });
        const fDesc = this.createElement('p', {
          className: 'modal-freeze-desc',
          text: 'You recorded a relapse on this date, but 1 Streak Freeze was automatically consumed to keep your clean streak alive.'
        });
        const fCard = this.createElement('div', {
          className: ['card-static', 'card-padded', 'modal-freeze-card'],
          children: [fTitle, fDesc]
        });
        modalContent.appendChild(fCard);
      } else {
        const makeMockCard = (badgeText, timeText, titleText, routineText, rewardText) => {
          const badge = this.createElement('span', { className: ['badge', 'badge-success'], text: badgeText });
          const time = this.createElement('span', { className: 'modal-time-label', text: timeText });
          const head = this.createElement('div', { className: 'modal-item-header', children: [badge, time] });
          const title = this.createElement('h4', { className: 'modal-habit-title-sm', text: titleText });
          const rep = this.createElement('p', { className: 'modal-rep-text', text: `Routine: ${routineText}` });
          const children = [head, title, rep];
          if (rewardText) {
            children.push(this.createElement('p', { className: 'modal-reward-text', text: `Reward Earned: ${rewardText}` }));
          }
          return this.createElement('div', {
            className: ['card-static', 'card-padded', 'modal-item-card'],
            children: children
          });
        };

        const card1 = makeMockCard('Substituted Successfully', '22:30', 'Late Night Snacking', '5-Min Deep Breathing & Herbal Tea', '10 Habit Coins');
        const card2 = makeMockCard('Substituted Successfully', '23:00', 'Doomscrolling in Bed', 'Read 5 Pages of Kindle Novel', null);

        const list = this.createElement('div', {
          className: 'modal-cards-list',
          children: [card1, card2]
        });
        modalContent.appendChild(list);
      }
    }

    modal.classList.add('open');
  }

  closeModal() {
    const modal = document.getElementById('calendar-detail-modal') || document.getElementById('habit-modal');
    if (modal) modal.classList.remove('open');
  }
}

window.CalendarGridComponent = CalendarGridComponent;
