/**
 * CalendarPageController — Habitizer Interactive Calendar Controller.
 * Single Responsibility: Coordinate calendar views, Google Calendar sync actions,
 * smart free-slot auto-scheduling, and modal management using CalendarGridComponent.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  const calendarGrid = new CalendarGridComponent();

  const prevBtn = document.getElementById('cal-prev-btn');
  const nextBtn = document.getElementById('cal-next-btn');
  const viewBtns = document.querySelectorAll('.view-btn');

  // Detail Modal
  const detailModal = document.getElementById('calendar-detail-modal');
  const detailModalClose = document.getElementById('modal-close-btn');
  const detailModalCloseX = document.getElementById('modal-close-x-btn');

  // Google Calendar Sync Modal
  const gcalModal = document.getElementById('google-sync-modal');
  const gcalModalOpenBtn = document.getElementById('btn-open-gcal-modal');
  const gcalModalCloseBtn = document.getElementById('gcal-modal-close-btn');
  const gcalDoneBtn = document.getElementById('btn-close-gcal-modal');

  const icalUrlInput = document.getElementById('gcal-ical-input');
  const saveIcalBtn = document.getElementById('btn-save-ical-url');
  const googleOauthBtn = document.getElementById('btn-oauth-gcal');
  const loadDemoBtn = document.getElementById('btn-load-demo-gcal');
  const disconnectGcalBtn = document.getElementById('btn-disconnect-gcal');

  const autoFitHabitsBtn = document.getElementById('btn-auto-fit-habits');

  async function loadData() {
    try {
      const user = await window.API.getCurrentUser();
      const habits = await window.API.getHabits();
      const isSynced = await window.API.isCalendarConnected();
      const events = isSynced ? await window.API.getCalendarEvents() : [];

      calendarGrid.setData(user, habits, events, isSynced);

      // Prepopulate iCal URL in modal if present
      const syncInfo = await window.API.getCalendarSyncInfo();
      if (icalUrlInput && syncInfo.icalUrl) {
        icalUrlInput.value = syncInfo.icalUrl;
      }
    } catch (err) {
      console.error("Error loading calendar data:", err);
    }
  }

  await loadData();

  // Navigation Arrow Handlers (Week, 3-Day, Day, Month)
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (calendarGrid.currentView === 'month') {
        calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() - 1);
      } else if (calendarGrid.currentView === '3day') {
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 3);
      } else if (calendarGrid.currentView === 'day') {
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 1);
      } else {
        // Week view: Shift 7 days backward
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 7);
      }
      calendarGrid.render();
    });
  }

  const todayBtn = document.getElementById('cal-today-btn');
  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      calendarGrid.currentDate = new Date(2026, 7, 28);
      calendarGrid.render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (calendarGrid.currentView === 'month') {
        calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() + 1);
      } else if (calendarGrid.currentView === '3day') {
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 3);
      } else if (calendarGrid.currentView === 'day') {
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 1);
      } else {
        // Week view: Shift 7 days forward
        calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 7);
      }
      calendarGrid.render();
    });
  }

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calendarGrid.currentView = btn.getAttribute('data-view');
      calendarGrid.render();
    });
  });

  // Refresh Schedule Button
  if (autoFitHabitsBtn) {
    autoFitHabitsBtn.addEventListener('click', async () => {
      try {
        const todayStr = '2026-08-28';
        await window.API.autoScheduleHabitsIntoFreeSlots(todayStr);
        await loadData();
        if (window.Toast) {
          window.Toast.show('Schedule refreshed and aligned with your calendar!', 'success');
        }
      } catch (err) {
        if (window.Toast) window.Toast.show('Error refreshing schedule: ' + err.message, 'error');
      }
    });
  }

  // Google Calendar Modal Actions
  if (gcalModalOpenBtn && gcalModal) {
    gcalModalOpenBtn.addEventListener('click', () => {
      gcalModal.classList.add('open');
    });
  }

  if (gcalModalCloseBtn && gcalModal) {
    gcalModalCloseBtn.addEventListener('click', () => {
      gcalModal.classList.remove('open');
    });
  }

  if (gcalDoneBtn && gcalModal) {
    gcalDoneBtn.addEventListener('click', () => {
      gcalModal.classList.remove('open');
    });
  }

  if (gcalModal) {
    gcalModal.addEventListener('click', (e) => {
      if (e.target === gcalModal) gcalModal.classList.remove('open');
    });
  }

  // Connect via iCal Link
  if (saveIcalBtn && icalUrlInput) {
    saveIcalBtn.addEventListener('click', async () => {
      const url = icalUrlInput.value;
      if (!url) {
        if (window.Toast) window.Toast.show('Please enter a valid iCal feed URL', 'error');
        return;
      }
      try {
        const res = await window.API.connectCalendarIcal(url);
        await loadData();
        if (gcalModal) gcalModal.classList.remove('open');
        if (window.Toast) window.Toast.show(res.message, 'success');
      } catch (err) {
        if (window.Toast) window.Toast.show(err.message, 'error');
      }
    });
  }

  // Connect via Google Account
  if (googleOauthBtn) {
    googleOauthBtn.addEventListener('click', async () => {
      try {
        const emailInput = document.getElementById('gcal-email-input');
        const email = emailInput && emailInput.value ? emailInput.value : 'alex.doe@gmail.com';
        const res = await window.API.connectCalendarGoogle(email);
        await loadData();
        if (gcalModal) gcalModal.classList.remove('open');
        if (window.Toast) window.Toast.show(res.message, 'success');
      } catch (err) {
        if (window.Toast) window.Toast.show(err.message, 'error');
      }
    });
  }

  // Load Demo Schedule
  if (loadDemoBtn) {
    loadDemoBtn.addEventListener('click', async () => {
      try {
        const res = await window.API.connectCalendarGoogle('demo.alex@gmail.com');
        await loadData();
        if (gcalModal) gcalModal.classList.remove('open');
        if (window.Toast) window.Toast.show('Loaded sample Google Calendar schedule (4 busy blocks)!', 'success');
      } catch (err) {
        if (window.Toast) window.Toast.show(err.message, 'error');
      }
    });
  }

  // Disconnect Google Calendar
  if (disconnectGcalBtn) {
    disconnectGcalBtn.addEventListener('click', async () => {
      await window.API.disconnectCalendar();
      if (icalUrlInput) icalUrlInput.value = '';
      await loadData();
      if (gcalModal) gcalModal.classList.remove('open');
      if (window.Toast) window.Toast.show('Google Calendar disconnected.', 'info');
    });
  }

  // Habit Detail Modal Close
  if (detailModalClose) {
    detailModalClose.addEventListener('click', () => {
      calendarGrid.closeModal();
    });
  }

  if (detailModalCloseX) {
    detailModalCloseX.addEventListener('click', () => {
      calendarGrid.closeModal();
    });
  }

  // Sidebar Controls
  const themeToggleBtn = document.getElementById('cal-theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      if (window.ThemeManager) {
        const tm = new window.ThemeManager();
        tm.toggle();
      }
    });
  }

  const logoutBtn = document.getElementById('cal-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.Toast) window.Toast.show('Logged out successfully', 'info');
      setTimeout(() => {
        if (window.API) window.API.logout();
      }, 350);
    });
  }

  const mobileSidebarToggle = document.getElementById('cal-sidebar-mobile-toggle');
  const sidebarEl = document.getElementById('cal-sidebar');
  if (mobileSidebarToggle && sidebarEl) {
    mobileSidebarToggle.addEventListener('click', () => {
      sidebarEl.classList.toggle('open');
    });
  }
});
