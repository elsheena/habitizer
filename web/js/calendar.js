/**
 * CalendarPageController — Habitizer Interactive Calendar Page Controller.
 * Single Responsibility: Wire UI buttons, navigation, and modal events to CalendarGridComponent.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) return;

  const calendarGrid = new CalendarGridComponent();
  const prevBtn = document.getElementById('cal-prev-btn');
  const nextBtn = document.getElementById('cal-next-btn');
  const todayBtn = document.getElementById('cal-today-btn');
  const viewBtns = document.querySelectorAll('.view-btn');
  const icalUrlInput = document.getElementById('gcal-ical-input');
  const gcalModal = document.getElementById('google-sync-modal');

  async function loadData() {
    try {
      const user = await window.API.getCurrentUser();
      const habits = await window.API.getHabits();
      const isSynced = await window.API.isCalendarConnected();
      const events = isSynced ? await window.API.getCalendarEvents() : [];
      calendarGrid.setData(user, habits, events, isSynced);

      const syncInfo = await window.API.getCalendarSyncInfo();
      if (icalUrlInput && syncInfo?.icalUrl) icalUrlInput.value = syncInfo.icalUrl;
    } catch (err) {
      console.error("Error loading calendar data:", err);
    }
  }

  await loadData();

  // Navigation
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (calendarGrid.currentView === 'month') calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() - 1);
      else if (calendarGrid.currentView === '3day') calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 3);
      else if (calendarGrid.currentView === 'day') calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 1);
      else calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() - 7);
      calendarGrid.render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (calendarGrid.currentView === 'month') calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() + 1);
      else if (calendarGrid.currentView === '3day') calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 3);
      else if (calendarGrid.currentView === 'day') calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 1);
      else calendarGrid.currentDate.setDate(calendarGrid.currentDate.getDate() + 7);
      calendarGrid.render();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const now = new Date();
      calendarGrid.currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

  // Refresh Schedule CTA
  const autoFitBtn = document.getElementById('btn-auto-fit-habits');
  if (autoFitBtn) {
    autoFitBtn.addEventListener('click', async () => {
      try {
        const todayStr = CalendarDateUtil.toDateKey(calendarGrid.currentDate || new Date());
        await window.API.autoScheduleHabitsIntoFreeSlots(todayStr);
        await loadData();
        if (window.Toast) window.Toast.show('Schedule aligned with calendar', 'success');
      } catch (err) {
        if (window.Toast) window.Toast.show('Error updating schedule', 'error');
      }
    });
  }

  // Google Calendar Sync Modal
  const gcalOpen = document.getElementById('btn-open-gcal-modal');
  const gcalClose = document.getElementById('btn-close-gcal-modal') || document.getElementById('gcal-modal-close-btn');
  if (gcalOpen && gcalModal) gcalOpen.addEventListener('click', () => gcalModal.classList.add('open'));
  if (gcalClose && gcalModal) gcalClose.addEventListener('click', () => gcalModal.classList.remove('open'));
  if (gcalModal) gcalModal.addEventListener('click', (e) => { if (e.target === gcalModal) gcalModal.classList.remove('open'); });

  const saveIcalBtn = document.getElementById('btn-save-ical-url');
  if (saveIcalBtn && icalUrlInput) {
    saveIcalBtn.addEventListener('click', async () => {
      const url = icalUrlInput.value;
      if (!url) return;
      try {
        await window.API.connectCalendarIcal(url);
        await loadData();
        if (gcalModal) gcalModal.classList.remove('open');
        if (window.Toast) window.Toast.show('Calendar feed connected', 'success');
      } catch (e) {
        if (window.Toast) window.Toast.show('Failed to connect feed', 'error');
      }
    });
  }

  const loadDemoBtn = document.getElementById('btn-load-demo-gcal');
  if (loadDemoBtn) {
    loadDemoBtn.addEventListener('click', async () => {
      await window.API.connectCalendarGoogle('demo.alex@gmail.com');
      await loadData();
      if (gcalModal) gcalModal.classList.remove('open');
      if (window.Toast) window.Toast.show('Sample Google Calendar loaded', 'success');
    });
  }

  const disconnectBtn = document.getElementById('btn-disconnect-gcal');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async () => {
      await window.API.disconnectCalendar();
      if (icalUrlInput) icalUrlInput.value = '';
      await loadData();
      if (gcalModal) gcalModal.classList.remove('open');
      if (window.Toast) window.Toast.show('Calendar disconnected', 'info');
    });
  }

  // Sidebar Controls
  const themeBtn = document.getElementById('cal-theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', () => { if (window.ThemeManager) new window.ThemeManager().toggle(); });

  const logoutBtn = document.getElementById('cal-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.Toast) window.Toast.show('Logged out', 'info');
      setTimeout(() => { if (window.API) window.API.logout(); }, 300);
    });
  }

  const mobileSidebarToggle = document.getElementById('cal-sidebar-mobile-toggle');
  const sidebarEl = document.getElementById('cal-sidebar');
  if (mobileSidebarToggle && sidebarEl) mobileSidebarToggle.addEventListener('click', () => sidebarEl.classList.toggle('open'));
});
