// Google Calendar Page Controller (Month, Week, 3 Days, Day Hourly Views)

import { store } from "../state.js";
import { ApiClient } from "../api.js";
import { showToast } from "../toast.js";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function initCalendarPage() {
  setupViewControls();
  renderCalendar();

  store.subscribe((eventKey) => {
    if (eventKey === "HABITS_UPDATED" || eventKey === "HABIT_ADDED" || eventKey === "HABIT_REMOVED" || eventKey === "CALENDAR_VIEW_CHANGED" || eventKey === "DATE_CHANGED") {
      renderCalendar();
    }
  });
}

function setupViewControls() {
  const views = ["month", "week", "3day", "day"];
  views.forEach(v => {
    const btn = document.getElementById(`view-${v}`);
    if (btn) {
      btn.addEventListener("click", () => {
        views.forEach(m => {
          const el = document.getElementById(`view-${m}`);
          if (el) el.classList.remove("active");
        });
        btn.classList.add("active");
        store.setCalendarViewMode(v);
      });
    }
  });

  const prevBtn = document.getElementById("btn-prev-period");
  if (prevBtn) prevBtn.addEventListener("click", prevPeriod);

  const nextBtn = document.getElementById("btn-next-period");
  if (nextBtn) nextBtn.addEventListener("click", nextPeriod);

  const todayBtn = document.getElementById("btn-today");
  if (todayBtn) todayBtn.addEventListener("click", goToToday);
}

function prevPeriod() {
  const mode = store.getState().calendarViewMode;
  const d = new Date(store.getState().currentDate);

  if (mode === "month") d.setMonth(d.getMonth() - 1);
  else if (mode === "week") d.setDate(d.getDate() - 7);
  else if (mode === "3day") d.setDate(d.getDate() - 3);
  else d.setDate(d.getDate() - 1);

  store.setCurrentDate(d);
}

function nextPeriod() {
  const mode = store.getState().calendarViewMode;
  const d = new Date(store.getState().currentDate);

  if (mode === "month") d.setMonth(d.getMonth() + 1);
  else if (mode === "week") d.setDate(d.getDate() + 7);
  else if (mode === "3day") d.setDate(d.getDate() + 3);
  else d.setDate(d.getDate() + 1);

  store.setCurrentDate(d);
}

function goToToday() {
  store.setCurrentDate(new Date(2026, 6, 25));
}

export function renderCalendar() {
  const wrapper = document.getElementById("calendar-grid-wrapper");
  if (!wrapper) return;

  const mode = store.getState().calendarViewMode;
  if (mode === "month") {
    renderMonthGrid(wrapper);
  } else {
    renderHourlyGrid(wrapper, mode);
  }
}

// Render Month View Grid
function renderMonthGrid(wrapper) {
  const state = store.getState();
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  
  const titleEl = document.getElementById("calendar-month-year");
  if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

  let html = `
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    html += `<div class="calendar-cell other-month"><span class="cell-day-num">${dayNum}</span></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = (day === 25 && month === 6 && year === 2026);
    const dayOfWeek = new Date(year, month, day).getDay();

    html += `<div class="calendar-cell ${isToday ? 'today' : ''}">`;
    html += `<span class="cell-day-num">${day}</span>`;

    state.habits.forEach(h => {
      let shouldRender = false;
      if (h.frequency === "daily") shouldRender = true;
      else if (h.frequency === "twice_weekly" && (dayOfWeek === 2 || dayOfWeek === 4)) shouldRender = true;
      else if (h.frequency === "weekly" && dayOfWeek === 1) shouldRender = true;

      if (shouldRender) {
        const goodHabitName = h.replacement_habit ? h.replacement_habit : "Healthy Replacement Routine";
        const badHabitName = h.bad_habit;
        const timeStr = h.scheduled_time || "09:00";

        html += `
          <div class="event-chip" style="cursor:pointer" data-id="${h.id}" title="Scheduled: ${timeStr} | ${goodHabitName}">
            <span class="chip-time-tag">${escapeHtml(timeStr)}</span>
            <span class="good-habit-label">${escapeHtml(goodHabitName)}</span>
            <span class="bad-habit-label">Replaces: ${escapeHtml(badHabitName)}</span>
          </div>
        `;
      }
    });

    html += `</div>`;
  }

  html += `</div>`;
  wrapper.innerHTML = html;
  attachEventChipListeners(wrapper);
}

// Render Hourly Timeline View Grid (Week / 3 Days / Day)
function renderHourlyGrid(wrapper, mode) {
  const state = store.getState();
  let numDays = 7;
  if (mode === "3day") numDays = 3;
  if (mode === "day") numDays = 1;

  const startDate = new Date(state.currentDate);
  if (mode === "week") {
    startDate.setDate(startDate.getDate() - startDate.getDay());
  }

  const dayCols = [];
  for (let d = 0; d < numDays; d++) {
    const colDate = new Date(startDate);
    colDate.setDate(startDate.getDate() + d);
    dayCols.push(colDate);
  }

  const firstColMonth = monthNames[dayCols[0].getMonth()];
  const lastColMonth = monthNames[dayCols[dayCols.length - 1].getMonth()];
  const year = dayCols[0].getFullYear();
  
  const titleEl = document.getElementById("calendar-month-year");
  if (titleEl) {
    if (firstColMonth === lastColMonth) {
      titleEl.textContent = `${firstColMonth} ${year} (${mode.toUpperCase()} VIEW)`;
    } else {
      titleEl.textContent = `${firstColMonth} - ${lastColMonth} ${year} (${mode.toUpperCase()} VIEW)`;
    }
  }

  let html = `<div class="hourly-calendar-container"><div class="hourly-grid cols-${numDays}">`;

  html += `<div class="hourly-header-cell">TIME</div>`;
  dayCols.forEach(colDate => {
    const isToday = (colDate.getDate() === 25 && colDate.getMonth() === 6 && colDate.getFullYear() === 2026);
    const dayStr = `${dayNames[colDate.getDay()]} ${colDate.getMonth()+1}/${colDate.getDate()}`;
    html += `<div class="hourly-header-cell ${isToday ? 'today' : ''}" style="${isToday ? 'color:var(--pink-text);font-weight:800' : ''}">${dayStr}</div>`;
  });

  for (let hour = 0; hour < 24; hour++) {
    const hourPad = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    html += `<div class="hour-label-cell">${hourPad}</div>`;

    dayCols.forEach(colDate => {
      const dayOfWeek = colDate.getDay();
      html += `<div class="hour-slot-cell">`;

      state.habits.forEach(h => {
        let shouldRender = false;
        if (h.frequency === "daily") shouldRender = true;
        else if (h.frequency === "twice_weekly" && (dayOfWeek === 2 || dayOfWeek === 4)) shouldRender = true;
        else if (h.frequency === "weekly" && dayOfWeek === 1) shouldRender = true;

        const habitHour = h.scheduled_time ? parseInt(h.scheduled_time.split(":")[0], 10) : 9;

        if (shouldRender && habitHour === hour) {
          const goodHabitName = h.replacement_habit ? h.replacement_habit : "Healthy Replacement Routine";
          const badHabitName = h.bad_habit;
          const timeStr = h.scheduled_time || "09:00";

          html += `
            <div class="event-chip" style="cursor:pointer" data-id="${h.id}" title="Scheduled: ${timeStr} | ${goodHabitName}">
              <span class="chip-time-tag">${escapeHtml(timeStr)}</span>
              <span class="good-habit-label">${escapeHtml(goodHabitName)}</span>
              <span class="bad-habit-label">Replaces: ${escapeHtml(badHabitName)}</span>
            </div>
          `;
        }
      });

      html += `</div>`;
    });
  }

  html += `</div></div>`;
  wrapper.innerHTML = html;
  attachEventChipListeners(wrapper);
}

function attachEventChipListeners(wrapper) {
  wrapper.querySelectorAll(".event-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const habitId = chip.getAttribute("data-id");
      openHabitDetailModal(habitId);
    });
  });
}

// Habit Detail Pop-up Modal Logic
export function openHabitDetailModal(habitId) {
  const h = store.getState().habits.find(item => item.id === habitId);
  if (!h) return;

  const goodHabitName = h.replacement_habit ? h.replacement_habit : "Healthy Replacement Routine";
  const badHabitName = h.bad_habit;
  const schedTime = h.scheduled_time || "09:00";

  document.getElementById("modal-habit-title").innerHTML = `
    <span style="color:var(--emerald-text)">${escapeHtml(goodHabitName)}</span>
    <div style="font-size:0.85rem;color:var(--red-text);font-weight:600;margin-top:0.2rem">Replaces Bad Habit: ${escapeHtml(badHabitName)}</div>
  `;
  document.getElementById("modal-habit-category").textContent = h.category || "General";
  document.getElementById("modal-habit-freq").textContent = h.frequency || "daily";
  document.getElementById("modal-habit-time").textContent = `${schedTime} Slot`;
  document.getElementById("modal-habit-cue").textContent = h.cue_trigger || "Not specified";
  document.getElementById("modal-habit-replacement").innerHTML = `<span class="detail-value good-green">${escapeHtml(goodHabitName)}</span>`;
  document.getElementById("modal-habit-reward").textContent = h.reward ? h.reward : "Screen time & streak currency";

  const deleteBtn = document.getElementById("modal-btn-delete");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (confirm("Are you sure you want to delete this habit substitution routine?")) {
        await ApiClient.deleteHabit(h.id);
        store.removeHabit(h.id);
        closeHabitDetailModal();
        showToast("Habit deleted successfully!", "info");
      }
    };
  }

  const modal = document.getElementById("habit-detail-modal");
  if (modal) modal.style.display = "flex";
}

export function closeHabitDetailModal() {
  const modal = document.getElementById("habit-detail-modal");
  if (modal) modal.style.display = "none";
}

window.closeHabitDetailModal = closeHabitDetailModal;

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
