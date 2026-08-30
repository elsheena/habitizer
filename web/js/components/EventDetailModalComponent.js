/**
 * EventDetailModalComponent — Event Inspection, Inline Editing & Deletion Modal.
 * Single Responsibility: Display detailed event and habit substitution metadata, manage inline field updates,
 * and handle deletion with real-time UI synchronization.
 */
class EventDetailModalComponent extends UIComponent {
  /**
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onEventUpdated]
   * @param {Function} [callbacks.onEventDeleted]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
    this.modalId = 'calendar-event-edit-modal';
    this.activeItem = null;
    this._initEvents();
  }

  /**
   * Open the modal for a specific card item.
   * @param {Object} item - card object with .data, .type, .title, etc.
   * @param {Object} dateObj - date context
   */
  open(item, dateObj) {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;

    this.activeItem = { item, dateObj };

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
        habitDetails.textContent = '';
        const cueDiv = document.createElement('div');
        cueDiv.appendChild(this._createBoldLabel('Trigger Cue: ', h.cue_trigger || 'Specified cue'));

        const replaceDiv = document.createElement('div');
        replaceDiv.appendChild(this._createBoldLabel('Replaces: ', h.bad_habit || 'Unwanted habit'));

        const rewardDiv = document.createElement('div');
        rewardDiv.appendChild(this._createBoldLabel('Reward: ', h.reward || '10 Habit Coins'));

        habitDetails.appendChild(cueDiv);
        habitDetails.appendChild(replaceDiv);
        habitDetails.appendChild(rewardDiv);
      }
      if (descInput) descInput.value = `Avoids: ${h.bad_habit || 'Trigger'}`;
      if (locInput) locInput.value = h.category || 'Health & Wellness';
      if (tagInput) tagInput.value = 'Health';
      if (deleteBtn) {
        deleteBtn.textContent = 'Delete Habit';
      }
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
      if (deleteBtn) {
        deleteBtn.textContent = 'Delete Event';
      }
    }

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Close the modal.
   */
  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('open');
    this.activeItem = null;
  }

  _createBoldLabel(label, val) {
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = label;
    span.appendChild(strong);
    span.appendChild(document.createTextNode(val));
    return span;
  }

  _initEvents() {
    const bind = () => {
      const modal = document.getElementById(this.modalId);
      const closeX = document.getElementById('edit-modal-close-x');
      const btnCancel = document.getElementById('btn-cancel-edit-event');
      const btnSave = document.getElementById('btn-save-edit-event');
      const btnDelete = document.getElementById('btn-delete-event');

      if (closeX) closeX.addEventListener('click', () => this.close());
      if (btnCancel) btnCancel.addEventListener('click', () => this.close());

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.close();
        });
      }

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
            }

            this.close();
            if (this.callbacks.onEventUpdated) {
              this.callbacks.onEventUpdated({ id, type, title });
            }
            if (window.Toast) {
              window.Toast.show(`Updated "${title}" successfully!`, 'success');
            }
          } catch (err) {
            console.error('Failed to update event:', err);
            if (window.Toast) window.Toast.show('Failed to save changes.', 'error');
          }
        });
      }

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
            } else {
              if (window.API && window.API.deleteCalendarEvent) {
                await window.API.deleteCalendarEvent(id);
              }
            }

            this.close();
            if (this.callbacks.onEventDeleted) {
              this.callbacks.onEventDeleted({ id, type, title });
            }
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
      document.addEventListener('DOMContentLoaded', bind);
    } else {
      bind();
    }
  }
}

window.EventDetailModalComponent = EventDetailModalComponent;
