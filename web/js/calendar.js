/**
 * CalendarPageController — Habitizer Interactive Calendar Controller.
 * Single Responsibility: Coordinate calendar views and event logs using CalendarGridComponent.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.API && !window.API.requireAuth()) {
    return;
  }

  if (window.Navbar) {
    window.Navbar.render('calendar');
  }

  const calendarGrid = new CalendarGridComponent();

  const prevBtn = document.getElementById('cal-prev-btn');
  const nextBtn = document.getElementById('cal-next-btn');
  const viewBtns = document.querySelectorAll('.view-btn');
  const modal = document.getElementById('calendar-detail-modal') || document.getElementById('habit-modal');
  const modalClose = document.getElementById('modal-close-btn') || document.getElementById('modal-close');

  try {
    const user = await window.API.getCurrentUser();
    const habits = await window.API.getHabits();
    calendarGrid.setData(user, habits);
  } catch (err) {
    console.error("Error loading calendar habits:", err);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() - 1);
      calendarGrid.render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarGrid.currentDate.setMonth(calendarGrid.currentDate.getMonth() + 1);
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

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      calendarGrid.closeModal();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        calendarGrid.closeModal();
      }
    });
  }
});
