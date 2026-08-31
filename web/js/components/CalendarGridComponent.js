/**
 * CalendarGridComponent — UI Component for interactive habit calendar & hourly timetable.
 * Single Responsibility: Build and render Hourly Timetable Matrix (Week, 3-Day, Day) with continuous
 * floating event and habit cards hovering across grid slots, and Month calendar view.
 * Delegates modal dialogs and collision mathematics to dedicated sub-components.
 *
 * Implemented per UML 2.0 specifications.
 * Zero Emojis Enforced.
 */
class CalendarGridComponent extends UIComponent {
  /**
   * @param {Object} [options]
   * @param {number} [options.systemYear=2026]
   * @param {number} [options.systemMonth=7] // August (0-indexed)
   * @param {number} [options.systemDay=28]
   */
  constructor(options = {}) {
    super();
    this.systemYear = options.systemYear || 2026;
    this.systemMonth = options.systemMonth !== undefined ? options.systemMonth : 7; // August
    this.systemDay = options.systemDay || 28;

    this.currentDate = new Date(this.systemYear, this.systemMonth, this.systemDay);
    this.currentView = 'week'; // 'week', '3day', 'day', 'month'
    this.habits = [];
    this.events = [];
    this.user = { id: '', full_name: 'Alex', tier: 'free' };
    this.calendarSynced = false;

    this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Hourly intervals for all 24 hours (00:00 to 24:00)
    this.hourStart = 0;
    this.hourEnd = 24;
    this.hourRowHeight = 56; // 56px per 60 minutes

    // Active drag-and-drop state
    this._draggedItem = null;

    // Sub-Component Collaborators (Single Responsibility Delegation)
    this.slotCreationModal = new SlotCreationModalComponent({
      onEventCreated: () => this._onDataChanged()
    });

    this.eventDetailModal = new EventDetailModalComponent({
      onEventUpdated: () => this._onDataChanged(),
      onEventDeleted: () => this._onDataChanged()
    });

    this.rescheduleScopeModal = new RescheduleScopeModalComponent({
      onScopeSelected: (scope, ctx) => this._applyRescheduleScope(scope, ctx)
    });

    this.dayLogModal = new DayLogModalComponent();
  }

  /**
   * Set active data and re-render.
   * @param {Object} user
   * @param {Array<Object>} habits
   * @param {Array<Object>} [events]
   * @param {boolean} [calendarSynced]
   */
  setData(user, habits, events = [], calendarSynced = false) {
    this.user = user || this.user;
    this.habits = habits || [];
    this.events = events || [];
    this.calendarSynced = calendarSynced;
    this.render();
  }

  async _onDataChanged() {
    try {
      if (window.API) {
        if (window.API.getHabits) this.habits = await window.API.getHabits();
        if (window.API.getCalendarEvents) this.events = await window.API.getCalendarEvents();
      }
      this.render();
    } catch (err) {
      console.error('Failed to reload calendar data:', err);
    }
  }

  render() {
    this._updateTitle();
    this._updateSyncBanner();
    this._updateSidebarUserInfo();
    const container = document.getElementById('calendar-view-container') || document.getElementById('calendar-grid-wrapper');
    if (!container) return;

    container.textContent = '';

    let viewElement;
    if (this.currentView === 'month') {
      viewElement = this._buildMonthView();
    } else if (this.currentView === '3day') {
      viewElement = this._buildHourlyTimetable(3);
    } else if (this.currentView === 'day') {
      viewElement = this._buildHourlyTimetable(1);
    } else {
      viewElement = this._buildHourlyTimetable(7);
    }

    container.appendChild(viewElement);
    if (window.Icons) window.Icons.renderAll();
  }

  _getDisplayedDates(dayCount = 7) {
    const curr = new Date(this.currentDate);
    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowsMonFirst = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (dayCount === 1) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const isToday = (curr.getFullYear() === 2026 && curr.getMonth() === 7 && curr.getDate() === 28);
      return [{
        date: new Date(curr),
        dow: dows[curr.getDay()],
        dayNum: curr.getDate(),
        monthName: this.monthNames[curr.getMonth()].slice(0, 3),
        dateKey: `${yyyy}-${mm}-${dd}`,
        isToday: isToday
      }];
    }

    if (dayCount === 3) {
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(curr);
        d.setDate(curr.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const isToday = (d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 28);
        dates.push({
          date: d,
          dow: dows[d.getDay()],
          dayNum: d.getDate(),
          monthName: this.monthNames[d.getMonth()].slice(0, 3),
          dateKey: `${yyyy}-${mm}-${dd}`,
          isToday: isToday
        });
      }
      return dates;
    }

    // 7 Days (Monday to Sunday of current week)
    const dayOfWeek = (curr.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isToday = (d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 28);
      dates.push({
        date: d,
        dow: dowsMonFirst[i],
        dayNum: d.getDate(),
        monthName: this.monthNames[d.getMonth()].slice(0, 3),
        dateKey: `${yyyy}-${mm}-${dd}`,
        isToday: isToday
      });
    }
    return dates;
  }

  _updateTitle() {
    const titleEl = document.getElementById('cal-month-title') || document.getElementById('calendar-month-year');
    if (!titleEl) return;
    const curr = new Date(this.currentDate);

    if (this.currentView === 'month') {
      const m = this.monthNames[curr.getMonth()];
      const y = curr.getFullYear();
      titleEl.textContent = `${m} ${y}`;
    } else if (this.currentView === 'day') {
      const dows = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const m = this.monthNames[curr.getMonth()].slice(0, 3);
      titleEl.textContent = `${dows[curr.getDay()]}, ${m} ${curr.getDate()}, ${curr.getFullYear()}`;
    } else if (this.currentView === '3day') {
      const dates = this._getDisplayedDates(3);
      const first = dates[0];
      const last = dates[dates.length - 1];
      if (first.monthName === last.monthName) {
        titleEl.textContent = `${first.monthName} ${first.dayNum} – ${last.dayNum}, ${first.date.getFullYear()}`;
      } else {
        titleEl.textContent = `${first.monthName} ${first.dayNum} – ${last.monthName} ${last.dayNum}, ${last.date.getFullYear()}`;
      }
    } else {
      // Week
      const dates = this._getDisplayedDates(7);
      const first = dates[0];
      const last = dates[dates.length - 1];
      if (first.monthName === last.monthName) {
        titleEl.textContent = `${first.monthName} ${first.dayNum} – ${last.dayNum}, ${first.date.getFullYear()}`;
      } else {
        titleEl.textContent = `${first.monthName} ${first.dayNum} – ${last.monthName} ${last.dayNum}, ${last.date.getFullYear()}`;
      }
    }
  }

  _updateSyncBanner() {
    const badge = document.getElementById('cal-sync-status-badge');
    if (badge) {
      badge.textContent = '';
      if (this.calendarSynced) {
        const iconSpan = this.createElement('span', { attrs: { 'data-icon': 'check', 'data-size': '12' } });
        badge.appendChild(iconSpan);
        badge.appendChild(document.createTextNode(` Connected (${this.events.length} Events)`));
        badge.className = 'badge badge-google-active';
      } else {
        const iconSpan = this.createElement('span', { attrs: { 'data-icon': 'alert', 'data-size': '12' } });
        badge.appendChild(iconSpan);
        badge.appendChild(document.createTextNode(' Disconnected'));
        badge.className = 'badge badge-gray';
      }
    }
  }

  _updateSidebarUserInfo() {
    const avatarEl = document.getElementById('cal-sidebar-avatar');
    const nameEl = document.getElementById('cal-sidebar-name');
    const tierEl = document.getElementById('cal-sidebar-tier');

    if (this.user) {
      const name = this.user.full_name || 'Alex Doe';
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = name;
      if (tierEl) {
        const isPro = this.user.tier === 'premium';
        tierEl.textContent = isPro ? 'Habitizer Pro' : 'Free Starter';
        tierEl.className = isPro ? 'sidebar-tier-pro' : 'sidebar-tier-free';
      }
    }
  }

  /**
   * Builds the Hourly Timetable Matrix with continuous hovering event blocks.
   * @param {number} dayCount (7 for week, 3 for 3-day, 1 for day)
   */
  _buildHourlyTimetable(dayCount = 7) {
    const wrapper = this.createElement('div', { className: 'hourly-timetable-container' });
    const displayedDates = this._getDisplayedDates(dayCount);

    const totalHours = this.hourEnd - this.hourStart; // 24 hours (00:00 - 24:00)
    const totalColumnHeight = totalHours * this.hourRowHeight;

    // 1. TOP STICKY HEADER ROW
    const headerRow = this.createElement('div', {
      className: 'hourly-timetable-header',
      attrs: {
        style: `grid-template-columns: 75px repeat(${displayedDates.length}, minmax(0, 1fr));`
      }
    });

    // Top-left corner cell
    const cornerCell = this.createElement('div', {
      className: 'hourly-first-cell',
      children: [
        this.createElement('span', { className: 'corner-label-time', text: 'Time' }),
        this.createElement('span', { className: 'corner-label-day', text: 'Day' })
      ]
    });
    headerRow.appendChild(cornerCell);

    // Date header cells
    displayedDates.forEach(dateObj => {
      const dowSpan = this.createElement('span', { className: 'hourly-dow', text: dateObj.dow });
      const daySpan = this.createElement('span', { className: 'hourly-day-num', text: `${dateObj.dayNum} ${dateObj.monthName}` });
      const headerChildren = [dowSpan, daySpan];

      if (dateObj.isToday) {
        headerChildren.push(this.createElement('span', { className: 'hourly-today-badge', text: 'Today' }));
      }

      const dateHeaderCell = this.createElement('div', {
        className: ['hourly-date-cell', dateObj.isToday ? 'today-col-header' : ''],
        children: headerChildren,
        events: {
          click: () => this.openDayModal(dateObj.dayNum, 7, 2026, dateObj.dateKey)
        }
      });
      headerRow.appendChild(dateHeaderCell);
    });

    wrapper.appendChild(headerRow);

    // 2. TIMETABLE BODY (Scrollable Y-Axis with Fixed Time Grid & Floating Event Layer)
    const bodyRow = this.createElement('div', {
      className: 'hourly-timetable-body',
      attrs: {
        style: `grid-template-columns: 75px repeat(${displayedDates.length}, minmax(0, 1fr));`
      }
    });

    // Left Time Labels Column
    const timeLabelsCol = this.createElement('div', { className: 'hourly-time-labels-column' });
    for (let h = this.hourStart; h < this.hourEnd; h++) {
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      const nextHourStr = h + 1 === 24 ? '00:00' : `${String(h + 1).padStart(2, '0')}:00`;
      const timeCell = this.createElement('div', {
        className: 'hourly-time-slot-label',
        attrs: { style: `height: ${this.hourRowHeight}px;` },
        children: [
          this.createElement('span', { className: 'hourly-time-start', text: hourStr }),
          this.createElement('span', { className: 'hourly-time-end', text: nextHourStr })
        ]
      });
      timeLabelsCol.appendChild(timeCell);
    }
    bodyRow.appendChild(timeLabelsCol);

    // Day Columns with Continuous Hovering Event Cards
    displayedDates.forEach(dateObj => {
      const dayCol = this._buildDayColumnWithFloatingEvents(dateObj, totalHours, totalColumnHeight);
      bodyRow.appendChild(dayCol);
    });

    wrapper.appendChild(bodyRow);
    return wrapper;
  }

  /**
   * Builds a Day Column with background grid lines, drag-and-drop target slots,
   * and multi-column side-by-side divided overlapping event cards.
   */
  _buildDayColumnWithFloatingEvents(dateObj, totalHours, totalColumnHeight) {
    const dayCol = this.createElement('div', {
      className: ['hourly-day-column', dateObj.isToday ? 'today-day-column' : ''],
      attrs: { style: `height: ${totalColumnHeight}px;` }
    });

    // Background Hour Slots Grid Lines (Click to Add & Drop Targets)
    for (let h = this.hourStart; h < this.hourEnd; h++) {
      const hourStartStr = `${String(h).padStart(2, '0')}:00`;
      const bgSlot = this.createElement('div', {
        className: 'hourly-bg-slot',
        attrs: {
          style: `height: ${this.hourRowHeight}px;`,
          'data-date': dateObj.dateKey,
          'data-hour': String(h),
          'data-time': hourStartStr
        },
        events: {
          click: (e) => {
            if (e.target.closest('.floating-event-card')) return;
            this.slotCreationModal.open(dateObj, hourStartStr);
          },
          dragover: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const rect = bgSlot.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const pct = Math.max(0, Math.min(0.99, offsetY / rect.height));
            const minuteOffset = Math.min(45, Math.floor((pct * 60) / 15) * 15);
            const snapTime = `${String(h).padStart(2, '0')}:${String(minuteOffset).padStart(2, '0')}`;
            bgSlot.classList.add('slot-drag-hover');
            bgSlot.setAttribute('data-drag-snap', snapTime);
          },
          dragleave: () => {
            bgSlot.classList.remove('slot-drag-hover');
            bgSlot.removeAttribute('data-drag-snap');
          },
          drop: (e) => {
            e.preventDefault();
            bgSlot.classList.remove('slot-drag-hover');
            bgSlot.removeAttribute('data-drag-snap');
            const rect = bgSlot.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const pct = Math.max(0, Math.min(0.99, offsetY / rect.height));
            const minuteOffset = Math.min(45, Math.floor((pct * 60) / 15) * 15);

            const dragged = this._draggedItem;
            if (!dragged) return;

            // Check if item is recurring:
            // 1. Habit loops repeat by default (daily/weekly substitution routines).
            // 2. Events repeat ONLY if explicitly configured with repeat: 'daily' | 'weekly' | 'weekdays'.
            // Google calendar events and one-time custom events (repeat: 'none') are one-time and NEVER show modal.
            let isRecurring = false;
            if (dragged.type === 'habit') {
              isRecurring = true;
            } else if (dragged.type === 'event') {
              const r = (dragged.data?.repeat || '').toLowerCase();
              if (r === 'daily' || r === 'weekly' || r === 'weekdays') {
                isRecurring = true;
              }
            }

            if (isRecurring) {
              this.rescheduleScopeModal.open(dragged, dateObj.dateKey, h, minuteOffset);
            } else {
              // Direct reschedule for one-time non-repeating events without modal popup
              this._applyRescheduleScope('single', {
                item: dragged,
                targetDateKey: dateObj.dateKey,
                targetHour: h,
                targetMinute: minuteOffset
              });
            }
          }
        }
      });

      const addBtn = this.createElement('button', {
        className: 'hourly-bg-add-btn',
        text: `+ ${hourStartStr}`,
        events: {
          click: (e) => {
            e.stopPropagation();
            this.slotCreationModal.open(dateObj, hourStartStr);
          }
        }
      });
      bgSlot.appendChild(addBtn);
      dayCol.appendChild(bgSlot);
    }

    // Active Now Line Indicator for Today
    if (dateObj.isToday) {
      const activeLineTop = 14.5 * this.hourRowHeight;
      const activeLine = this.createElement('div', {
        className: 'active-now-time-line',
        attrs: { style: `top: ${activeLineTop}px;` },
        children: [
          this.createElement('span', { className: 'active-now-dot' }),
          this.createElement('span', { className: 'active-now-pill', text: 'Now' })
        ]
      });
      dayCol.appendChild(activeLine);
    }

    // Prepare items for this day:
    // Non-repeating events ONLY show on the exact date they were added (never before or after!).
    // Repeating events ONLY show starting from the date they were added (dateObj.dateKey >= e.date), never before!
    const dayEvents = (this.events || []).filter(e => {
      const eventStart = e.date || '2026-08-28';
      const r = (e.repeat || 'none').toLowerCase();

      if (r === 'daily') {
        return dateObj.dateKey >= eventStart;
      } else if (r === 'weekdays') {
        const dayOfWeek = dateObj.date.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        return dateObj.dateKey >= eventStart && isWeekday;
      } else if (r === 'weekly') {
        const startDate = new Date(eventStart + 'T00:00:00');
        const isSameDow = dateObj.date.getDay() === startDate.getDay();
        return dateObj.dateKey >= eventStart && isSameDow;
      } else {
        return dateObj.dateKey === eventStart;
      }
    });
    const dayStartMin = this.hourStart * 60;
    const dayEndMin = this.hourEnd * 60;

    const rawItems = [];

    // 1. Ingest Events with Date-Specific Schedule Scoping
    dayEvents.forEach(ev => {
      let sTime = ev.startTime || '09:00';
      let eTime = ev.endTime || '10:00';

      if (ev.date_overrides && ev.date_overrides[dateObj.dateKey]) {
        sTime = ev.date_overrides[dateObj.dateKey].startTime || sTime;
        eTime = ev.date_overrides[dateObj.dateKey].endTime || eTime;
      } else if (ev.future_overrides && Array.isArray(ev.future_overrides) && ev.future_overrides.length > 0) {
        const sorted = [...ev.future_overrides].sort((a, b) => b.fromDate.localeCompare(a.fromDate));
        const applicable = sorted.find(ov => ov.fromDate <= dateObj.dateKey);
        if (applicable) {
          sTime = applicable.startTime;
          eTime = applicable.endTime;
        } else {
          const earliest = sorted[sorted.length - 1];
          if (earliest && earliest.prevStartTime && dateObj.dateKey < earliest.fromDate) {
            sTime = earliest.prevStartTime;
            eTime = earliest.prevEndTime;
          }
        }
      }

      const evS = CalendarService.timeToMinutes(sTime);
      const evE = CalendarService.timeToMinutes(eTime);
      if (evE > dayStartMin && evS < dayEndMin) {
        rawItems.push({
          type: 'event',
          id: ev.id,
          data: ev,
          title: ev.title,
          sub: ev.location || (ev.isGoogleEvent ? 'Google Calendar' : 'Custom Event'),
          dateKey: dateObj.dateKey,
          startMin: Math.max(evS, dayStartMin),
          endMin: Math.min(evE, dayEndMin),
          startTime: sTime,
          endTime: eTime,
          isGoogle: Boolean(ev.isGoogleEvent)
        });
      }
    });

    // 2. Ingest Habits with Date-Specific Schedule Scoping
    (this.habits || []).forEach(h => {
      const hTime = (window.API && window.API.getEffectiveHabitTime)
        ? window.API.getEffectiveHabitTime(h, dateObj.dateKey)
        : (h.date_overrides?.[dateObj.dateKey] || h.scheduled_time || '09:00');
      const hStart = CalendarService.timeToMinutes(hTime);
      const hDuration = 30;
      const hEnd = hStart + hDuration;

      if (hEnd > dayStartMin && hStart < dayEndMin) {
        const isConflict = dayEvents.some(ev => {
          const evS = CalendarService.timeToMinutes(ev.startTime || '09:00');
          const evE = CalendarService.timeToMinutes(ev.endTime || '10:00');
          return (hStart < evE && hEnd > evS);
        });

        rawItems.push({
          type: 'habit',
          id: h.id,
          data: h,
          title: h.replacement_habit || 'Healthy Routine',
          sub: `Avoids: ${h.bad_habit || 'Trigger'}`,
          dateKey: dateObj.dateKey,
          startMin: Math.max(hStart, dayStartMin),
          endMin: Math.min(hEnd, dayEndMin),
          startTime: hTime,
          endTime: CalendarService.minutesToTime(hEnd),
          isConflict: isConflict
        });
      }
    });

    // 3. Compute Smart Multi-Column Overlap Slicing via CollisionEngine
    const positionedItems = CollisionEngine.computeColumns(rawItems);

    // 4. Render Positioned Cards
    positionedItems.forEach(item => {
      const startOffsetMin = item.startMin - dayStartMin;
      const durationMin = item.endMin - item.startMin;

      const topPx = (startOffsetMin / 60) * this.hourRowHeight;
      const heightPx = Math.max(22, (durationMin / 60) * this.hourRowHeight - 2);
      const isCompact = heightPx < 44;

      const cardClasses = ['floating-event-card'];
      if (item.type === 'event') {
        cardClasses.push(item.isGoogle ? 'card-google-floating' : 'card-custom-floating');
      } else {
        cardClasses.push(item.isConflict ? 'card-amber-floating' : 'card-emerald-floating');
      }
      if (isCompact) cardClasses.push('compact-floating');

      const cardChildren = [];
      const iconName = item.type === 'event' ? (item.isGoogle ? 'google' : 'calendar') : (item.isConflict ? 'alert' : 'check');
      const timeBadge = this.createElement('div', {
        className: 'floating-card-time',
        children: [
          this.createElement('span', { attrs: { 'data-icon': iconName, 'data-size': '11' } }),
          this.createElement('span', { text: `${item.startTime} - ${item.endTime}` })
        ]
      });
      cardChildren.push(timeBadge);

      const titleEl = this.createElement('div', {
        className: 'floating-card-title',
        text: item.type === 'habit' && item.isConflict ? `Conflict: ${item.title}` : item.title
      });
      cardChildren.push(titleEl);

      if (!isCompact && item.sub) {
        const subEl = this.createElement('div', { className: 'floating-card-sub', text: item.sub });
        cardChildren.push(subEl);
      }

      const leftPct = (item.colIndex / item.totalCols) * 100;
      const widthPct = (1 / item.totalCols) * 100;

      const cardStyle = `top: ${topPx}px; height: ${heightPx}px; left: calc(${leftPct}% + 3px); width: calc(${widthPct}% - 6px);`;

      const cardEl = this.createElement('div', {
        className: cardClasses,
        attrs: {
          style: cardStyle,
          title: `${item.title} (${item.startTime} - ${item.endTime})\n${item.sub}\n(Drag to reschedule)`,
          draggable: 'true'
        },
        children: cardChildren,
        events: {
          click: (e) => {
            e.stopPropagation();
            this.eventDetailModal.open(item, dateObj);
          },
          dragstart: (e) => {
            this._draggedItem = item;
            cardEl.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type, id: item.id }));
            e.dataTransfer.effectAllowed = 'move';
          },
          dragend: () => {
            cardEl.classList.remove('is-dragging');
            this._draggedItem = null;
          }
        }
      });

      dayCol.appendChild(cardEl);
    });

    return dayCol;
  }

  async _applyRescheduleScope(scope, ctx) {
    if (!ctx) return;
    const { item, targetDateKey, targetHour, targetMinute } = ctx;
    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const origDurationMin = Math.max(15, (item.endMin || 0) - (item.startMin || 0));
    const newStartTotalMin = (targetHour * 60) + targetMinute;
    const newEndMin = newStartTotalMin + origDurationMin;
    const newEndTime = CalendarService.minutesToTime(newEndMin);

    try {
      if (item.type === 'habit') {
        if (window.API && window.API.updateHabitScheduleScope) {
          await window.API.updateHabitScheduleScope(item.id, scope, targetDateKey, newStartTime);
        } else if (scope === 'all') {
          await window.API.updateHabitTime(item.id, newStartTime);
        }
      } else if (item.type === 'event') {
        if (window.API && window.API.updateEventScheduleScope) {
          await window.API.updateEventScheduleScope(item.id, scope, targetDateKey, newStartTime, newEndTime, item.title);
        } else {
          await window.API.updateCalendarEvent(item.id, {
            date: targetDateKey,
            startTime: newStartTime,
            endTime: newEndTime
          });
        }
      }

      await this._onDataChanged();
      const scopeLabel = scope === 'all' 
        ? 'all occurrences in series' 
        : scope === 'future' 
          ? 'this and all future occurrences' 
          : 'this event only';
      if (window.Toast) {
        window.Toast.show(`Rescheduled "${item.title}" to ${newStartTime} (${scopeLabel})!`, 'success');
      }
    } catch (err) {
      console.error('Failed to apply reschedule scope:', err);
      if (window.Toast) window.Toast.show('Could not update time slot.', 'error');
    }
  }

  jumpToDay(year, month, day) {
    this.currentDate = new Date(year, month, day);
    this.currentView = 'day';

    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(b => {
      if (b.getAttribute('data-view') === 'day') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.render();
  }

  openDayModal(day, month, year, dateKey) {
    this.dayLogModal.open(day, month, year, dateKey, this.habits, this.events, this.calendarSynced);
  }

  /**
   * Month View Renderer
   */
  _buildMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
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
      const targetDate = new Date(year, month - 1, d);
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(d) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', {
        className: ['calendar-cell', 'other-month'],
        children: [headerDiv],
        attrs: { title: `Switch to Day view for ${d}`, style: 'cursor: pointer;' },
        events: {
          click: () => this.jumpToDay(targetDate.getFullYear(), targetDate.getMonth(), d)
        }
      }));
    }

    // Current month active cells
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = (day === this.systemDay && month === this.systemMonth && year === this.systemYear);
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(day) });
      const headerChildren = [numSpan];

      if (isToday) {
        headerChildren.push(this.createElement('span', { className: 'badge-today-pill', text: 'Today' }));
      }

      const headerDiv = this.createElement('div', { className: 'cell-header', children: headerChildren });
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const chips = this._buildMonthChipsForDay(year, month, day, dStr);
      const chipsDiv = this.createElement('div', { className: 'habit-chips-container', children: chips });

      const cell = this.createElement('div', {
        className: ['calendar-cell', isToday ? 'today' : ''],
        children: [headerDiv, chipsDiv],
        attrs: { title: `Switch to Day timetable view for ${dStr}`, style: 'cursor: pointer;' },
        events: {
          click: () => this.jumpToDay(year, month, day)
        }
      });
      grid.appendChild(cell);
    }

    // Next month filler
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const targetDate = new Date(year, month + 1, i);
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(i) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', {
        className: ['calendar-cell', 'other-month'],
        children: [headerDiv],
        attrs: { title: `Switch to Day view for ${i}`, style: 'cursor: pointer;' },
        events: {
          click: () => this.jumpToDay(targetDate.getFullYear(), targetDate.getMonth(), i)
        }
      }));
    }

    return grid;
  }

  _buildMonthChipsForDay(year, month, day, dateKey) {
    const chips = [];
    const dayEvents = (this.events || []).filter(e => !e.date || e.date === dateKey);

    if (this.calendarSynced && dayEvents.length > 0) {
      const count = dayEvents.length;
      chips.push(this.createElement('div', {
        className: ['habit-chip', 'chip-google'],
        attrs: { title: `${count} Calendar Event(s)` },
        children: [
          this.createElement('span', { className: 'chip-icon', attrs: { 'data-icon': 'google', 'data-size': '12' } }),
          this.createElement('span', { className: 'chip-text', text: `${count} Event${count > 1 ? 's' : ''}` })
        ]
      }));
    }

    if (this.habits && this.habits.length > 0) {
      this.habits.slice(0, 2).forEach(h => {
        const title = h.replacement_habit || h.bad_habit || "Healthy Routine";
        chips.push(this.createElement('div', {
          className: ['habit-chip', 'chip-substituted'],
          attrs: { title: `Routine: ${title}` },
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

window.CalendarGridComponent = CalendarGridComponent;
