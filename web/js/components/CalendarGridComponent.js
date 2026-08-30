/**
 * CalendarGridComponent — UI Component for interactive habit calendar & hourly timetable.
 * Single Responsibility: Build Hourly Timetable Matrix (Week, 3-Day, Day) with continuous
 * floating event and habit cards hovering across grid slots, Multi-Column Overlap Slicing
 * (zero overlapping occlusion), HTML5 Drag-and-Drop Rescheduling, Interactive Time Slot
 * Creation Modal (Habit vs Calendar Event), Month calendar view, and zero emoji compliance.
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

    // Slot creation, Event edit & Reschedule Scope modal states
    this._activeSlotContext = null;
    this._activeEditItem = null;
    this._pendingReschedule = null;
    this._initSlotModalEvents();
    this._initEventEditModalEvents();
    this._initRescheduleScopeModalEvents();
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

  render() {
    this._updateTitle();
    this._updateSyncBanner();
    this._updateSidebarUserInfo();
    const container = document.getElementById('calendar-view-container') || document.getElementById('calendar-grid-wrapper');
    if (!container) return;

    container.innerHTML = '';

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
      if (this.calendarSynced) {
        badge.innerHTML = `<span data-icon="check" data-size="12"></span> Connected (${this.events.length} Events)`;
        badge.className = 'badge badge-google-active';
      } else {
        badge.innerHTML = `<span data-icon="alert" data-size="12"></span> Disconnected`;
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
        tierEl.style.color = isPro ? '#38bdf8' : 'var(--emerald-primary, #10b981)';
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

    const totalHours = this.hourEnd - this.hourStart; // 15 hours (07:00 - 22:00)
    const totalColumnHeight = totalHours * this.hourRowHeight; // 840px

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
            this._openSlotCreationModal(dateObj, hourStartStr);
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
            this._openRescheduleScopeModal(dateObj.dateKey, h, minuteOffset);
          }
        }
      });

      const addBtn = this.createElement('button', {
        className: 'hourly-bg-add-btn',
        text: `+ ${hourStartStr}`,
        events: {
          click: (e) => {
            e.stopPropagation();
            this._openSlotCreationModal(dateObj, hourStartStr);
          }
        }
      });
      bgSlot.appendChild(addBtn);
      dayCol.appendChild(bgSlot);
    }

    // Active Now Line Indicator for Today
    if (dateObj.isToday) {
      const activeLineTop = 8 * this.hourRowHeight; // 15:00 indicator
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

    // Prepare all items to render for this day (Google events, custom events, and habit routines)
    const dayEvents = (this.events || []).filter(e => !e.date || e.date === dateObj.dateKey);
    const dayStartMin = this.hourStart * 60; // 420 min (07:00)
    const dayEndMin = this.hourEnd * 60;     // 1320 min (22:00)

    const rawItems = [];

    // 1. Ingest Events
    dayEvents.forEach(ev => {
      const evS = CalendarService.timeToMinutes(ev.startTime || '09:00');
      const evE = CalendarService.timeToMinutes(ev.endTime || '10:00');
      if (evE > dayStartMin && evS < dayEndMin) {
        rawItems.push({
          type: 'event',
          id: ev.id,
          data: ev,
          title: ev.title,
          sub: ev.location || (ev.isGoogleEvent ? 'Google Calendar' : 'Custom Event'),
          startMin: Math.max(evS, dayStartMin),
          endMin: Math.min(evE, dayEndMin),
          startTime: ev.startTime,
          endTime: ev.endTime,
          isGoogle: Boolean(ev.isGoogleEvent)
        });
      }
    });

    // 2. Ingest Habits
    (this.habits || []).forEach(h => {
      const hTime = h.scheduled_time || '09:00';
      const hStart = CalendarService.timeToMinutes(hTime);
      const hDuration = 30; // 30 mins
      const hEnd = hStart + hDuration;

      if (hEnd > dayStartMin && hStart < dayEndMin) {
        // Detect conflict
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
          startMin: Math.max(hStart, dayStartMin),
          endMin: Math.min(hEnd, dayEndMin),
          startTime: hTime,
          endTime: CalendarService.minutesToTime(hEnd),
          isConflict: isConflict
        });
      }
    });

    // 3. Compute Smart Multi-Column Overlap Slicing
    const positionedItems = this._computeEventCollisionColumns(rawItems);

    // 4. Render Positioned Cards
    positionedItems.forEach(item => {
      const startOffsetMin = item.startMin - dayStartMin;
      const durationMin = item.endMin - item.startMin;

      const topPx = (startOffsetMin / 60) * this.hourRowHeight;
      const heightPx = Math.max(22, (durationMin / 60) * this.hourRowHeight - 2);
      const isCompact = heightPx < 44;

      // Card Classes
      const cardClasses = ['floating-event-card'];
      if (item.type === 'event') {
        cardClasses.push(item.isGoogle ? 'card-google-floating' : 'card-custom-floating');
      } else {
        cardClasses.push(item.isConflict ? 'card-amber-floating' : 'card-emerald-floating');
      }
      if (isCompact) cardClasses.push('compact-floating');

      // Inner Elements
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

      // Column Slicing Positioning Styles
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
            this._openEventDetailModal(item, dateObj);
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

  /**
   * Overlapping Event Collision Engine:
   * Slices overlapping events into side-by-side vertical columns without clipping.
   *
   * @param {Array<Object>} items — raw items with startMin, endMin
   * @returns {Array<Object>} positioned items with colIndex and totalCols assigned
   */
  _computeEventCollisionColumns(items) {
    if (!items || items.length === 0) return [];

    // Sort by startMin ASC, then by duration DESC
    const sorted = [...items].sort((a, b) => {
      if (a.startMin !== b.startMin) return a.startMin - b.startMin;
      return (b.endMin - b.startMin) - (a.endMin - a.startMin);
    });

    // 1. Group items into connected collision clusters
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    sorted.forEach(item => {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endMin;
      } else {
        if (item.startMin < clusterEnd) {
          // Overlaps cluster
          currentCluster.push(item);
          clusterEnd = Math.max(clusterEnd, item.endMin);
        } else {
          // New cluster
          clusters.push(currentCluster);
          currentCluster = [item];
          clusterEnd = item.endMin;
        }
      }
    });
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // 2. Assign column index within each cluster
    const result = [];

    clusters.forEach(cluster => {
      const columns = []; // array of endMin for each column

      cluster.forEach(item => {
        let placedCol = -1;

        for (let c = 0; c < columns.length; c++) {
          if (columns[c] <= item.startMin) {
            placedCol = c;
            columns[c] = item.endMin;
            break;
          }
        }

        if (placedCol === -1) {
          placedCol = columns.length;
          columns.push(item.endMin);
        }

        item.colIndex = placedCol;
      });

      const totalCols = Math.max(1, columns.length);
      cluster.forEach(item => {
        item.totalCols = totalCols;
        result.push(item);
      });
    });

    return result;
  }

  /**
   * Handle Drag-and-Drop Drop Event on an Hourly Time Slot.
   * @param {string} targetDateKey
   * @param {number} targetHour
   * @param {number} [targetMinute=0] 0, 15, 30, or 45
   */
  async _handleDropOnSlot(targetDateKey, targetHour, targetMinute = 0) {
    if (!this._draggedItem) return;

    const item = this._draggedItem;
    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const origDurationMin = Math.max(15, item.endMin - item.startMin);
    const newStartTotalMin = (targetHour * 60) + targetMinute;
    const newEndMin = newStartTotalMin + origDurationMin;
    const newEndTime = CalendarService.minutesToTime(newEndMin);

    try {
      if (item.type === 'habit') {
        if (window.API && window.API.updateHabitTime) {
          await window.API.updateHabitTime(item.id, newStartTime);
          const updatedHabits = await window.API.getHabits();
          this.habits = updatedHabits;
          this.render();
          if (window.Toast) {
            window.Toast.show(`Rescheduled habit "${item.title}" to ${newStartTime}!`, 'success');
          }
        }
      } else if (item.type === 'event') {
        if (window.API && window.API.updateCalendarEvent) {
          await window.API.updateCalendarEvent(item.id, {
            date: targetDateKey,
            startTime: newStartTime,
            endTime: newEndTime
          });
          const updatedEvents = await window.API.getCalendarEvents();
          this.events = updatedEvents;
          this.render();
          if (window.Toast) {
            window.Toast.show(`Rescheduled event "${item.title}" to ${newStartTime}!`, 'success');
          }
        }
      }
    } catch (err) {
      console.error('Failed to reschedule item:', err);
      if (window.Toast) window.Toast.show('Could not update time slot.', 'error');
    }
  }

  /**
   * Open the Interactive Slot Creation Modal (Habit vs Calendar Event).
   * @param {Object} dateObj
   * @param {string} timeStr
   */
  _openSlotCreationModal(dateObj, timeStr) {
    const modal = document.getElementById('calendar-slot-create-modal');
    if (!modal) return;

    this._activeSlotContext = {
      dateKey: dateObj.dateKey,
      dow: dateObj.dow,
      dayNum: dateObj.dayNum,
      timeStr: timeStr
    };

    // Reset Modal View to Step 1 (Choice)
    const stepChoice = document.getElementById('slot-modal-step-choice');
    const stepForm = document.getElementById('slot-modal-step-form');
    const btnBack = document.getElementById('slot-modal-btn-back');
    const btnSubmit = document.getElementById('slot-modal-btn-submit');
    const btnCancel = document.getElementById('slot-modal-btn-cancel');
    const timeLabel = document.getElementById('slot-modal-time-label');

    if (stepChoice) stepChoice.style.display = 'block';
    if (stepForm) stepForm.style.display = 'none';
    if (btnBack) btnBack.style.display = 'none';
    if (btnSubmit) btnSubmit.style.display = 'none';
    if (btnCancel) btnCancel.style.display = 'inline-flex';

    if (timeLabel) {
      timeLabel.innerHTML = `Selected time slot: <strong>${dateObj.dow}, Aug ${dateObj.dayNum} at ${timeStr}</strong>`;
    }

    // Prefill form values for Step 2
    const startHour = parseInt(timeStr.split(':')[0], 10) || 9;
    const endHour = Math.min(24, startHour + 1);
    const endTimeStr = endHour === 24 ? '23:59' : `${String(endHour).padStart(2, '0')}:00`;

    const inputDate = document.getElementById('slot-ev-date');
    const inputStart = document.getElementById('slot-ev-start');
    const inputEnd = document.getElementById('slot-ev-end');
    const inputTitle = document.getElementById('slot-ev-title');
    const inputDesc = document.getElementById('slot-ev-desc');
    const inputLoc = document.getElementById('slot-ev-loc');

    if (inputDate) inputDate.value = dateObj.dateKey;
    if (inputStart) inputStart.value = timeStr;
    if (inputEnd) inputEnd.value = endTimeStr;
    if (inputTitle) inputTitle.value = '';
    if (inputDesc) inputDesc.value = '';
    if (inputLoc) inputLoc.value = '';

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Wire up event listeners for the Slot Creation Modal.
   * @private
   */
  _initSlotModalEvents() {
    const bindEvents = () => {
      const modal = document.getElementById('calendar-slot-create-modal');
      const closeX = document.getElementById('slot-modal-close-x');
      const btnCancel = document.getElementById('slot-modal-btn-cancel');
      const btnBack = document.getElementById('slot-modal-btn-back');
      const btnChoiceHabit = document.getElementById('btn-choice-habit');
      const btnChoiceEvent = document.getElementById('btn-choice-event');
      const btnSubmit = document.getElementById('slot-modal-btn-submit');
      const stepChoice = document.getElementById('slot-modal-step-choice');
      const stepForm = document.getElementById('slot-modal-step-form');

      const closeModal = () => {
        if (modal) modal.classList.remove('open');
      };

      if (closeX) closeX.addEventListener('click', closeModal);
      if (btnCancel) btnCancel.addEventListener('click', closeModal);

      // Choice A: Habit Substitution -> Redirect to /create
      if (btnChoiceHabit) {
        btnChoiceHabit.addEventListener('click', () => {
          closeModal();
          const targetTime = this._activeSlotContext ? this._activeSlotContext.timeStr : '09:00';
          window.location.href = `/create?time=${encodeURIComponent(targetTime)}`;
        });
      }

      // Choice B: Calendar Event -> Reveal Form
      if (btnChoiceEvent) {
        btnChoiceEvent.addEventListener('click', () => {
          if (stepChoice) stepChoice.style.display = 'none';
          if (stepForm) stepForm.style.display = 'block';
          if (btnBack) btnBack.style.display = 'inline-flex';
          if (btnSubmit) btnSubmit.style.display = 'inline-flex';
        });
      }

      // Back to Choice
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          if (stepChoice) stepChoice.style.display = 'block';
          if (stepForm) stepForm.style.display = 'none';
          if (btnBack) btnBack.style.display = 'none';
          if (btnSubmit) btnSubmit.style.display = 'none';
        });
      }

      // Submit Custom Event
      if (btnSubmit) {
        btnSubmit.addEventListener('click', async (e) => {
          e.preventDefault();
          const title = (document.getElementById('slot-ev-title')?.value || '').trim();
          const desc = (document.getElementById('slot-ev-desc')?.value || '').trim();
          const date = document.getElementById('slot-ev-date')?.value || '2026-08-28';
          const start = document.getElementById('slot-ev-start')?.value || '09:00';
          const end = document.getElementById('slot-ev-end')?.value || '10:00';
          const loc = (document.getElementById('slot-ev-loc')?.value || '').trim();
          const tag = document.getElementById('slot-ev-tag')?.value || 'General';

          if (!title) {
            if (window.Toast) window.Toast.show('Please enter an event title (* required)', 'error');
            document.getElementById('slot-ev-title')?.focus();
            return;
          }

          try {
            if (window.API && window.API.addCalendarEvent) {
              await window.API.addCalendarEvent({
                title: title,
                description: desc,
                date: date,
                startTime: start,
                endTime: end,
                location: loc,
                tag: tag,
                isGoogleEvent: false
              });

              const updatedEvents = await window.API.getCalendarEvents();
              this.events = updatedEvents;
              this.render();
              closeModal();

              if (window.Toast) {
                window.Toast.show(`Calendar event "${title}" added successfully!`, 'success');
              }
            }
          } catch (err) {
            console.error('Failed to create event:', err);
            if (window.Toast) window.Toast.show('Failed to save event.', 'error');
          }
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }
  }

  /**
   * Open the Event Detail & Edit Modal for inspecting and updating an event or habit.
   * @param {Object} item - positioned card item containing .data, .type, .title, etc.
   * @param {Object} dateObj - date object context
   */
  _openEventDetailModal(item, dateObj) {
    const modal = document.getElementById('calendar-event-edit-modal');
    if (!modal) return;

    this._activeEditItem = { item, dateObj };

    const titleText = document.getElementById('edit-modal-title-text');
    const badge = document.getElementById('edit-modal-badge');
    const habitInfo = document.getElementById('edit-habit-loop-info');
    const habitDetails = document.getElementById('edit-habit-loop-details');
    const idInput = document.getElementById('edit-ev-id');
    const typeInput = document.getElementById('edit-ev-type');
    const titleInput = document.getElementById('edit-ev-title');
    const descInput = document.getElementById('edit-ev-desc');
    const dateInput = document.getElementById('edit-ev-date');
    const tagInput = document.getElementById('edit-ev-tag');
    const startInput = document.getElementById('edit-ev-start');
    const endInput = document.getElementById('edit-ev-end');
    const locInput = document.getElementById('edit-ev-loc');
    const deleteBtn = document.getElementById('btn-delete-event');

    if (idInput) idInput.value = item.id || '';
    if (typeInput) typeInput.value = item.type || 'event';
    if (titleInput) titleInput.value = item.title || '';
    if (dateInput) dateInput.value = dateObj.dateKey || '2026-08-28';
    if (startInput) startInput.value = item.startTime || '09:00';
    if (endInput) endInput.value = item.endTime || '10:00';

    if (item.type === 'habit') {
      const h = item.data || {};
      if (titleText) titleText.textContent = 'Habit Routine Details';
      if (badge) {
        badge.textContent = 'Healthy Routine';
        badge.className = 'badge badge-emerald';
      }
      if (habitInfo) habitInfo.style.display = 'block';
      if (habitDetails) {
        habitDetails.innerHTML = `
          <div><strong>Trigger Cue:</strong> ${h.cue_trigger || 'Specified cue'}</div>
          <div><strong>Replaces:</strong> ${h.bad_habit || 'Unwanted habit'}</div>
          <div><strong>Reward:</strong> ${h.reward || '10 Habit Coins'}</div>
        `;
      }
      if (descInput) descInput.value = `Avoids: ${h.bad_habit || 'Trigger'}`;
      if (locInput) locInput.value = h.category || 'Health & Wellness';
      if (tagInput) tagInput.value = 'Health';
      if (deleteBtn) deleteBtn.innerHTML = `<span data-icon="trash" data-size="14"></span> Delete Habit`;
    } else {
      const ev = item.data || {};
      if (titleText) titleText.textContent = 'Event Details';
      if (badge) {
        if (ev.isGoogleEvent) {
          badge.textContent = 'Google Calendar';
          badge.className = 'badge badge-google-active';
        } else {
          badge.textContent = 'Custom Event';
          badge.className = 'badge badge-blue';
        }
      }
      if (habitInfo) habitInfo.style.display = 'none';
      if (descInput) descInput.value = ev.description || '';
      if (locInput) locInput.value = ev.location || '';
      if (tagInput) tagInput.value = ev.tag || 'Work';
      if (deleteBtn) deleteBtn.innerHTML = `<span data-icon="trash" data-size="14"></span> Delete Event`;
    }

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Wire up event listeners for the Event Detail & Edit Modal.
   * @private
   */
  _initEventEditModalEvents() {
    const bindEvents = () => {
      const modal = document.getElementById('calendar-event-edit-modal');
      const closeX = document.getElementById('edit-modal-close-x');
      const btnCancel = document.getElementById('btn-cancel-edit-event');
      const btnSave = document.getElementById('btn-save-edit-event');
      const btnDelete = document.getElementById('btn-delete-event');

      const closeModal = () => {
        if (modal) modal.classList.remove('open');
      };

      if (closeX) closeX.addEventListener('click', closeModal);
      if (btnCancel) btnCancel.addEventListener('click', closeModal);

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
      }

      // Save Event Changes
      if (btnSave) {
        btnSave.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = document.getElementById('edit-ev-id')?.value;
          const type = document.getElementById('edit-ev-type')?.value;
          const title = (document.getElementById('edit-ev-title')?.value || '').trim();
          const desc = (document.getElementById('edit-ev-desc')?.value || '').trim();
          const date = document.getElementById('edit-ev-date')?.value || '2026-08-28';
          const start = document.getElementById('edit-ev-start')?.value || '09:00';
          const end = document.getElementById('edit-ev-end')?.value || '10:00';
          const loc = (document.getElementById('edit-ev-loc')?.value || '').trim();
          const tag = document.getElementById('edit-ev-tag')?.value || 'Work';

          if (!title) {
            if (window.Toast) window.Toast.show('Please enter a title (* required)', 'error');
            document.getElementById('edit-ev-title')?.focus();
            return;
          }

          try {
            if (type === 'habit') {
              if (window.API && window.API.updateHabit) {
                await window.API.updateHabit(id, {
                  replacement_habit: title,
                  scheduled_time: start
                });
              } else if (window.API && window.API.updateHabitTime) {
                await window.API.updateHabitTime(id, start);
              }
              const updatedHabits = await window.API.getHabits();
              this.habits = updatedHabits;
            } else {
              if (window.API && window.API.updateCalendarEvent) {
                await window.API.updateCalendarEvent(id, {
                  title: title,
                  description: desc,
                  date: date,
                  startTime: start,
                  endTime: end,
                  location: loc,
                  tag: tag
                });
              }
              const updatedEvents = await window.API.getCalendarEvents();
              this.events = updatedEvents;
            }

            this.render();
            closeModal();
            if (window.Toast) {
              window.Toast.show(`Updated "${title}" successfully!`, 'success');
            }
          } catch (err) {
            console.error('Failed to update event:', err);
            if (window.Toast) window.Toast.show('Failed to save changes.', 'error');
          }
        });
      }

      // Delete Event
      if (btnDelete) {
        btnDelete.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = document.getElementById('edit-ev-id')?.value;
          const type = document.getElementById('edit-ev-type')?.value;
          const title = (document.getElementById('edit-ev-title')?.value || 'item').trim();

          try {
            if (type === 'habit') {
              if (window.API && window.API.deleteHabit) {
                await window.API.deleteHabit(id);
              }
              const updatedHabits = await window.API.getHabits();
              this.habits = updatedHabits;
            } else {
              if (window.API && window.API.deleteCalendarEvent) {
                await window.API.deleteCalendarEvent(id);
              }
              const updatedEvents = await window.API.getCalendarEvents();
              this.events = updatedEvents;
            }

            this.render();
            closeModal();
            if (window.Toast) {
              window.Toast.show(`Deleted "${title}" from calendar.`, 'info');
            }
          } catch (err) {
            console.error('Failed to delete event:', err);
            if (window.Toast) window.Toast.show('Failed to delete item.', 'error');
          }
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }
  }

  /**
   * Open the 3-Point Reschedule Scope Choice Modal.
   * (1. Only this event, 2. This and all future events, 3. All events in the series)
   * @param {string} targetDateKey
   * @param {number} targetHour
   * @param {number} targetMinute
   */
  _openRescheduleScopeModal(targetDateKey, targetHour, targetMinute = 0) {
    if (!this._draggedItem) return;

    this._pendingReschedule = {
      item: this._draggedItem,
      targetDateKey: targetDateKey,
      targetHour: targetHour,
      targetMinute: targetMinute
    };

    const modal = document.getElementById('calendar-reschedule-scope-modal');
    if (!modal) {
      this._applyRescheduleScope('single');
      return;
    }

    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const helpText = document.getElementById('scope-modal-help-text');
    if (helpText) {
      helpText.innerHTML = `You are moving <strong>"${this._draggedItem.title}"</strong> to <strong>${newStartTime}</strong> on <strong>${targetDateKey}</strong>.<br/>Which occurrences would you like to update?`;
    }

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Wire up event listeners for the Reschedule Scope Modal.
   * @private
   */
  _initRescheduleScopeModalEvents() {
    const bindEvents = () => {
      const modal = document.getElementById('calendar-reschedule-scope-modal');
      const closeX = document.getElementById('scope-modal-close-x');
      const btnCancel = document.getElementById('btn-scope-cancel');
      const btnSingle = document.getElementById('btn-scope-single');
      const btnFuture = document.getElementById('btn-scope-future');
      const btnAll = document.getElementById('btn-scope-all');

      const closeModal = () => {
        if (modal) modal.classList.remove('open');
        this._pendingReschedule = null;
      };

      if (closeX) closeX.addEventListener('click', closeModal);
      if (btnCancel) btnCancel.addEventListener('click', closeModal);

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
      }

      if (btnSingle) {
        btnSingle.addEventListener('click', () => {
          this._applyRescheduleScope('single');
          closeModal();
        });
      }

      if (btnFuture) {
        btnFuture.addEventListener('click', () => {
          this._applyRescheduleScope('future');
          closeModal();
        });
      }

      if (btnAll) {
        btnAll.addEventListener('click', () => {
          this._applyRescheduleScope('all');
          closeModal();
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindEvents);
    } else {
      bindEvents();
    }
  }

  /**
   * Apply the chosen reschedule scope ('single' | 'future' | 'all').
   * @param {'single'|'future'|'all'} scope
   */
  async _applyRescheduleScope(scope) {
    if (!this._pendingReschedule) return;

    const { item, targetDateKey, targetHour, targetMinute } = this._pendingReschedule;
    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const origDurationMin = Math.max(15, item.endMin - item.startMin);
    const newStartTotalMin = (targetHour * 60) + targetMinute;
    const newEndMin = newStartTotalMin + origDurationMin;
    const newEndTime = CalendarService.minutesToTime(newEndMin);

    try {
      if (item.type === 'habit') {
        if (scope === 'all' || scope === 'future') {
          if (window.API && window.API.updateHabitTime) {
            await window.API.updateHabitTime(item.id, newStartTime);
          }
        } else {
          if (window.API && window.API.addCalendarEvent) {
            await window.API.addCalendarEvent({
              title: item.title,
              description: `Routine scheduled for this date`,
              date: targetDateKey,
              startTime: newStartTime,
              endTime: newEndTime,
              tag: 'Health'
            });
          }
        }
        const updatedHabits = await window.API.getHabits();
        this.habits = updatedHabits;
      } else if (item.type === 'event') {
        if (scope === 'all') {
          const allEvents = await window.API.getCalendarEvents();
          for (const ev of allEvents) {
            if (ev.title === item.title && window.API.updateCalendarEvent) {
              await window.API.updateCalendarEvent(ev.id, {
                startTime: newStartTime,
                endTime: newEndTime
              });
            }
          }
        } else if (scope === 'future') {
          const allEvents = await window.API.getCalendarEvents();
          for (const ev of allEvents) {
            if (ev.title === item.title && ev.date >= targetDateKey && window.API.updateCalendarEvent) {
              await window.API.updateCalendarEvent(ev.id, {
                startTime: newStartTime,
                endTime: newEndTime
              });
            }
          }
        } else {
          if (window.API && window.API.updateCalendarEvent) {
            await window.API.updateCalendarEvent(item.id, {
              date: targetDateKey,
              startTime: newStartTime,
              endTime: newEndTime
            });
          }
        }
        const updatedEvents = await window.API.getCalendarEvents();
        this.events = updatedEvents;
      }

      this.render();
      const scopeLabel = scope === 'all' ? 'all occurrences in series' : scope === 'future' ? 'this and all future occurrences' : 'this event only';
      if (window.Toast) {
        window.Toast.show(`Rescheduled "${item.title}" to ${newStartTime} (${scopeLabel})!`, 'success');
      }
    } catch (err) {
      console.error('Failed to apply reschedule scope:', err);
      if (window.Toast) window.Toast.show('Could not update time slot.', 'error');
    }
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
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(d) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', { className: ['calendar-cell', 'other-month'], children: [headerDiv] }));
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
        events: {
          click: () => this.openDayModal(day, month, year, dStr)
        }
      });
      grid.appendChild(cell);
    }

    // Next month filler
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const numSpan = this.createElement('span', { className: 'cell-day-num', text: String(i) });
      const headerDiv = this.createElement('div', { className: 'cell-header', children: [numSpan] });
      grid.appendChild(this.createElement('div', { className: ['calendar-cell', 'other-month'], children: [headerDiv] }));
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

  openDayModal(day, month, year, dateKey) {
    const modal = document.getElementById('calendar-detail-modal') || document.getElementById('habit-modal');
    const modalTitle = document.getElementById('modal-habit-date') || document.getElementById('modal-habit-title');
    const modalContent = document.getElementById('modal-habit-content');
    if (!modal || !modalTitle || !modalContent) return;

    const mName = this.monthNames[month] || "August";
    modalTitle.textContent = `Daily Log — ${mName} ${day}, ${year}`;
    modalContent.innerHTML = '';

    const dayEvents = (this.events || []).filter(e => !e.date || e.date === dateKey);
    const freeSlots = window.API && window.API.getFreeSlots ? window.API.getFreeSlots(dateKey, this.events) : [];

    // Header Action: Refresh Schedule
    const refreshBtn = this.createElement('button', {
      className: ['btn', 'btn-primary', 'btn-sm', 'btn-full'],
      attrs: { style: 'margin-bottom: 0.85rem;' },
      text: 'Auto-Fit Habits into Free Slots',
      events: {
        click: async () => {
          if (window.API && window.API.autoScheduleHabitsIntoFreeSlots) {
            await window.API.autoScheduleHabitsIntoFreeSlots(dateKey);
            const updated = await window.API.getHabits();
            this.habits = updated;
            this.render();
            this.openDayModal(day, month, year, dateKey);
            if (window.Toast) window.Toast.show('Schedule aligned with your free time slots!', 'success');
          }
        }
      }
    });
    modalContent.appendChild(refreshBtn);

    // Section 1: Scheduled Calendar Events
    const gHeader = this.createElement('h4', { className: 'modal-subhead', text: `Scheduled Calendar Events (${dayEvents.length})` });
    modalContent.appendChild(gHeader);

    if (dayEvents.length === 0) {
      modalContent.appendChild(this.createElement('p', { className: 'modal-empty-text', text: 'No calendar events on this date.' }));
    } else {
      dayEvents.forEach(ev => {
        const badge = this.createElement('span', { className: ['badge', 'badge-google-pill'], text: `${ev.startTime} - ${ev.endTime}` });
        const title = this.createElement('h5', { className: 'modal-item-title-sm', text: ev.title });
        const loc = this.createElement('p', { className: 'modal-rep-text', text: `${ev.location || (ev.isGoogleEvent ? 'Google Calendar' : 'Custom')} — ${ev.description || 'Event'}` });
        modalContent.appendChild(this.createElement('div', {
          className: ['card-static', 'card-padded', 'modal-item-card', 'card-google-border'],
          children: [badge, title, loc]
        }));
      });
    }

    // Section 2: Open Free Time Gaps
    const fHeader = this.createElement('h4', { className: 'modal-subhead', attrs: { style: 'margin-top: 1rem;' }, text: `Open Free Time (${freeSlots.length} Slots)` });
    modalContent.appendChild(fHeader);

    if (freeSlots.length === 0) {
      modalContent.appendChild(this.createElement('p', { className: 'modal-empty-text', text: 'No free time gaps available.' }));
    } else {
      freeSlots.forEach(slot => {
        const badge = this.createElement('span', { className: ['badge', 'badge-freeslot-pill'], text: `${slot.startTime} - ${slot.endTime} (${slot.durationMinutes} min free)` });
        const title = this.createElement('h5', { className: 'modal-item-title-sm', text: `Free Time (${slot.period})` });
        const desc = this.createElement('p', { className: 'modal-rep-text', text: 'No events scheduled. Open time for healthy habits.' });
        modalContent.appendChild(this.createElement('div', {
          className: ['card-static', 'card-padded', 'modal-item-card', 'card-freeslot-border'],
          children: [badge, title, desc]
        }));
      });
    }

    // Section 3: My Healthy Habit Substitutions
    const hHeader = this.createElement('h4', { className: 'modal-subhead', attrs: { style: 'margin-top: 1rem;' }, text: `My Healthy Habits (${this.habits.length})` });
    modalContent.appendChild(hHeader);

    if (this.habits.length === 0) {
      modalContent.appendChild(this.createElement('p', { className: 'modal-empty-text', text: 'No habits configured yet.' }));
    } else {
      this.habits.forEach(h => {
        const badge = this.createElement('span', { className: ['badge', 'badge-success'], text: `Scheduled at ${h.scheduled_time || '09:00'}` });
        const title = this.createElement('h5', { className: 'modal-item-title-sm', text: h.replacement_habit || 'Healthy Routine' });
        const sub = this.createElement('p', { className: 'modal-rep-text', text: `Avoids: ${h.bad_habit}` });
        modalContent.appendChild(this.createElement('div', {
          className: ['card-static', 'card-padded', 'modal-item-card'],
          children: [badge, title, sub]
        }));
      });
    }

    modal.classList.add('open');
  }

  closeModal() {
    const modal = document.getElementById('calendar-detail-modal') || document.getElementById('habit-modal');
    if (modal) {
      modal.classList.remove('open');
    }
  }
}

window.CalendarGridComponent = CalendarGridComponent;
