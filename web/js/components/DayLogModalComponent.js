/**
 * DayLogModalComponent — Daily Habit & Event Log Modal.
 * Single Responsibility: Display daily summary of scheduled routines, Google events, and log statuses.
 */
class DayLogModalComponent extends UIComponent {
  constructor() {
    super();
    this.modalId = 'calendar-detail-modal';
    this._initEvents();
  }

  /**
   * Open daily log modal for a specific date.
   * @param {number} day
   * @param {number} month
   * @param {number} year
   * @param {string} dateKey
   * @param {Array<Object>} habits
   * @param {Array<Object>} events
   * @param {boolean} calendarSynced
   */
  open(day, month, year, dateKey, habits = [], events = [], calendarSynced = false) {
    const modal = document.getElementById(this.modalId);
    const dateTitle = document.getElementById('modal-habit-date');
    const content = document.getElementById('modal-habit-content');

    if (!modal || !content) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (dateTitle) {
      dateTitle.textContent = `Daily Log: ${monthNames[month]} ${day}, ${year}`;
    }

    content.textContent = '';

    // Day Events Section
    const dayEvents = (events || []).filter(e => !e.date || e.date === dateKey);
    if (calendarSynced && dayEvents.length > 0) {
      const gcalHeader = document.createElement('h4');
      gcalHeader.className = 'modal-section-subtitle';
      gcalHeader.textContent = 'Scheduled Calendar Events';
      content.appendChild(gcalHeader);

      const eventsList = document.createElement('div');
      eventsList.className = 'modal-events-list';

      dayEvents.forEach(ev => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'modal-event-item';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'modal-event-time';
        timeSpan.textContent = `${ev.startTime || '09:00'} - ${ev.endTime || '10:00'}`;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'modal-event-title';
        titleSpan.textContent = ev.title;

        itemDiv.appendChild(timeSpan);
        itemDiv.appendChild(titleSpan);
        eventsList.appendChild(itemDiv);
      });

      content.appendChild(eventsList);
    }

    // Habits Section
    const habitsHeader = document.createElement('h4');
    habitsHeader.className = 'modal-section-subtitle';
    habitsHeader.textContent = 'Active Habit Substitution Routines';
    content.appendChild(habitsHeader);

    if (!habits || habits.length === 0) {
      const emptyP = document.createElement('p');
      emptyP.className = 'modal-empty-text';
      emptyP.textContent = 'No habits scheduled for this day.';
      content.appendChild(emptyP);
    } else {
      const habitsList = document.createElement('div');
      habitsList.className = 'modal-habits-list';

      habits.forEach(h => {
        const hItem = document.createElement('div');
        hItem.className = 'modal-habit-item';

        const hTitle = document.createElement('div');
        hTitle.className = 'modal-habit-name';
        hTitle.textContent = h.replacement_habit || h.bad_habit || 'Healthy Routine';

        const hTime = document.createElement('div');
        hTime.className = 'modal-habit-time';
        hTime.textContent = `Scheduled at ${h.scheduled_time || '09:00'} (${h.frequency || 'daily'})`;

        hItem.appendChild(hTitle);
        hItem.appendChild(hTime);
        habitsList.appendChild(hItem);
      });

      content.appendChild(habitsList);
    }

    modal.classList.add('open');
  }

  /**
   * Close the daily log modal.
   */
  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('open');
  }

  _initEvents() {
    const bind = () => {
      const modal = document.getElementById(this.modalId);
      const closeX = document.getElementById('modal-close-x-btn');
      const closeBtn = document.getElementById('modal-close-btn');

      if (closeX) closeX.addEventListener('click', () => this.close());
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.close();
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind);
    } else {
      bind();
    }
  }
}

window.DayLogModalComponent = DayLogModalComponent;
