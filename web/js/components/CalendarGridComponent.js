class CalendarGridComponent extends UIComponent {
  constructor(options = {}) {
    super();
    const now = new Date();
    this.systemYear = options.systemYear || now.getFullYear();
    this.systemMonth = options.systemMonth !== undefined ? options.systemMonth : now.getMonth();
    this.systemDay = options.systemDay || now.getDate();

    this.currentDate = new Date(this.systemYear, this.systemMonth, this.systemDay);
    this.currentView = 'week';
    this.habits = [];
    this.events = [];
    this.user = { id: '', full_name: 'Alex', tier: 'free' };
    this.calendarSynced = false;

    this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.hourStart = 0;
    this.hourEnd = 24;
    this.hourRowHeight = 56;

    this.dragDrop = new CalendarDragDropController();
    this.monthView = new CalendarMonthViewComponent({ onDayClicked: (y, m, d) => this.jumpToDay(y, m, d) });
    this.cardRenderer = new CalendarFloatingCardRenderer({
      onEventClicked: (ev) => this.eventDetailModal?.open(ev),
      onHabitClicked: () => this.openDayModal(this.systemDay, this.systemMonth, this.systemYear)
    });
    this.slotCreationModal = new SlotCreationModalComponent({ onEventCreated: () => this._onDataChanged() });
    this.eventDetailModal = new EventDetailModalComponent({ onEventUpdated: () => this._onDataChanged(), onEventDeleted: () => this._onDataChanged() });
    this.rescheduleScopeModal = new RescheduleScopeModalComponent({ onScopeSelected: (scope, ctx) => this._applyRescheduleScope(scope, ctx) });
    this.dayLogModal = new DayLogModalComponent();
  }

  setData(user, habits, events = [], calendarSynced = false) {
    this.user = user || this.user;
    this.habits = habits || [];
    this.events = events || [];
    this.calendarSynced = calendarSynced;
    this.render();
  }

  async _onDataChanged() {
    if (window.API?.getHabits) this.habits = await window.API.getHabits();
    if (window.API?.getCalendarEvents) this.events = await window.API.getCalendarEvents();
    this.render();
  }

  render() {
    this._updateHeaderTitle();
    this._updateSyncStatus();
    this._updateSidebarUser();
    const container = document.getElementById('calendar-view-container') || document.getElementById('calendar-grid-wrapper');
    if (!container) return;
    container.textContent = '';

    if (this.currentView === 'month') {
      const now = new Date();
      container.appendChild(this.monthView.buildMonthView(
        this.currentDate.getFullYear(), this.currentDate.getMonth(), this.events, this.habits, this.calendarSynced,
        (y, m, d) => (y === now.getFullYear() && m === now.getMonth() && d === now.getDate())
      ));
    } else {
      const days = this.currentView === '3day' ? 3 : (this.currentView === 'day' ? 1 : 7);
      container.appendChild(this._buildHourlyTimetable(days));
      setTimeout(() => {
        const scroller = document.querySelector('.cal-fullpage-body');
        if (scroller && scroller.scrollTop === 0) {
          const now = new Date();
          const targetHour = Math.max(7, Math.min(18, now.getHours() - 1));
          scroller.scrollTop = targetHour * this.hourRowHeight;
        }
      }, 30);
    }
    if (window.Icons) window.Icons.renderAll();
  }

  _buildHourlyTimetable(dayCount) {
    const wrapper = this.createElement('div', { className: 'hourly-timetable-container' });
    const displayedDates = CalendarDateUtil.getDisplayedDates(this.currentDate, dayCount);
    const totalHeight = (this.hourEnd - this.hourStart) * this.hourRowHeight;

    const headerRow = this.createElement('div', { className: 'hourly-timetable-header', attrs: { style: `grid-template-columns: 75px repeat(${displayedDates.length}, minmax(0, 1fr));` } });
    headerRow.appendChild(this.createElement('div', { className: 'hourly-first-cell', children: [this.createElement('span', { className: 'corner-label-time', text: 'Time' }), this.createElement('span', { className: 'corner-label-day', text: 'Day' })] }));

    displayedDates.forEach(dateObj => {
      const children = [this.createElement('span', { className: 'hourly-dow', text: dateObj.dow }), this.createElement('span', { className: 'hourly-day-num', text: `${dateObj.dayNum} ${dateObj.monthName}` })];
      if (dateObj.isToday) children.push(this.createElement('span', { className: 'hourly-today-badge', text: 'Today' }));
      headerRow.appendChild(this.createElement('div', { className: ['hourly-date-cell', dateObj.isToday ? 'today-col-header' : ''], children, events: { click: () => this.openDayModal(dateObj.dayNum, dateObj.date.getMonth(), dateObj.date.getFullYear(), dateObj.dateKey) } }));
    });
    wrapper.appendChild(headerRow);

    const bodyRow = this.createElement('div', { className: 'hourly-timetable-body', attrs: { style: `grid-template-columns: 75px repeat(${displayedDates.length}, minmax(0, 1fr));` } });
    const timeLabelsCol = this.createElement('div', { className: 'hourly-time-labels-column' });
    for (let h = this.hourStart; h < this.hourEnd; h++) {
      timeLabelsCol.appendChild(this.createElement('div', { className: 'hourly-time-slot-label', attrs: { style: `height: ${this.hourRowHeight}px;` }, children: [this.createElement('span', { className: 'hourly-time-start', text: `${String(h).padStart(2, '0')}:00` }), this.createElement('span', { className: 'hourly-time-end', text: h + 1 === 24 ? '00:00' : `${String(h + 1).padStart(2, '0')}:00` })] }));
    }
    bodyRow.appendChild(timeLabelsCol);

    displayedDates.forEach(dateObj => {
      bodyRow.appendChild(this._buildDayColumn(dateObj, totalHeight));
    });
    wrapper.appendChild(bodyRow);
    return wrapper;
  }

  _buildDayColumn(dateObj, totalHeight) {
    const dayCol = this.createElement('div', { className: ['hourly-day-column', dateObj.isToday ? 'today-day-column' : ''], attrs: { style: `height: ${totalHeight}px;` } });

    for (let h = this.hourStart; h < this.hourEnd; h++) {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      const bgSlot = this.createElement('div', {
        className: 'hourly-bg-slot',
        attrs: { style: `height: ${this.hourRowHeight}px;`, 'data-date': dateObj.dateKey, 'data-hour': String(h) },
        events: {
          click: (e) => { if (!e.target.closest('.floating-event-card')) this.slotCreationModal.open(dateObj, hStr); },
          dragover: (e) => this.dragDrop.handleDragOver(e, bgSlot, h),
          dragleave: () => this.dragDrop.handleDragLeave(bgSlot),
          drop: (e) => this.dragDrop.handleDrop(e, bgSlot, dateObj, h, this.rescheduleScopeModal, (scope, ctx) => this._applyRescheduleScope(scope, ctx))
        },
        children: [this.createElement('button', { className: 'hourly-bg-add-btn', text: `+ ${hStr}`, events: { click: (e) => { e.stopPropagation(); this.slotCreationModal.open(dateObj, hStr); } } })]
      });
      dayCol.appendChild(bgSlot);
    }

    if (dateObj.isToday) {
      const now = new Date();
      const activeLineTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * this.hourRowHeight;
      dayCol.appendChild(this.createElement('div', { className: 'active-now-time-line', attrs: { style: `top: ${activeLineTop}px;` }, children: [this.createElement('span', { className: 'active-now-dot' }), this.createElement('span', { className: 'active-now-pill', text: 'Now' })] }));
    }

    const rawItems = CalendarDateUtil.collectDayItems(dateObj, this.events, this.habits);
    const cardEls = this.cardRenderer.renderCards(rawItems, this.hourRowHeight, this.dragDrop);
    cardEls.forEach(el => dayCol.appendChild(el));
    return dayCol;
  }

  async _applyRescheduleScope(scope, ctx) {
    if (!ctx) return;
    const { item, targetDateKey, targetHour, targetMinute } = ctx;
    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const origDurationMin = Math.max(15, (item.endMin || 0) - (item.startMin || 0));
    const newEndTime = CalendarService.minutesToTime((targetHour * 60) + targetMinute + origDurationMin);

    try {
      if (item.type === 'habit') await window.API.updateHabitScheduleScope(item.id, scope, targetDateKey, newStartTime);
      else await window.API.updateEventScheduleScope(item.id, scope, targetDateKey, newStartTime, newEndTime, item.title);
      await this._onDataChanged();
      if (window.Toast) window.Toast.show(`Rescheduled to ${newStartTime}`, 'success');
    } catch (err) {
      if (window.Toast) window.Toast.show('Could not update schedule', 'error');
    }
  }

  jumpToDay(year, month, day) {
    this.currentDate = new Date(year, month, day);
    this.currentView = 'day';
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-view') === 'day'));
    this.render();
  }

  openDayModal(day, month, year, dateKey) {
    if (this.dayLogModal) this.dayLogModal.open(day, month, year, dateKey, this.habits, this.events);
  }

  _updateHeaderTitle() {
    const titleEl = document.getElementById('cal-month-title') || document.getElementById('calendar-month-year');
    if (!titleEl) return;
    const curr = new Date(this.currentDate);
    if (this.currentView === 'month') titleEl.textContent = `${this.monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
    else if (this.currentView === 'day') titleEl.textContent = `${curr.getDate()} ${this.monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
    else {
      const dates = CalendarDateUtil.getDisplayedDates(this.currentDate, this.currentView === '3day' ? 3 : 7);
      titleEl.textContent = `${dates[0].monthName} ${dates[0].dayNum} – ${dates[dates.length - 1].dayNum}, ${dates[0].date.getFullYear()}`;
    }
  }

  _updateSyncStatus() {
    const badge = document.getElementById('cal-sync-status-badge');
    if (badge) {
      badge.textContent = this.calendarSynced ? ` Connected (${this.events.length} Events)` : ' Disconnected';
      badge.className = this.calendarSynced ? 'badge badge-google-active' : 'badge badge-gray';
    }
  }

  _updateSidebarUser() {
    const nameEl = document.getElementById('cal-sidebar-name');
    const tierEl = document.getElementById('cal-sidebar-tier');
    if (nameEl && this.user) nameEl.textContent = this.user.full_name || 'Alex Doe';
    if (tierEl && this.user) tierEl.textContent = this.user.tier === 'premium' ? 'Habitizer Pro' : 'Free Starter';
  }
}

window.CalendarGridComponent = CalendarGridComponent;
