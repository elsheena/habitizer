/**
 * EventDetailModalComponent — Event & Habit Detail Inspection & Editing Modal.
 * Single Responsibility: Present event details modal, manage field bindings, and dispatch updates and deletions.
 */
class EventDetailModalComponent extends UIComponent {
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
    this.modalId = 'calendar-event-edit-modal';
    this.activeItem = null;
    this._initEvents();
  }

  open(item, dateObj) {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;
    this.activeItem = { item, dateObj };

    const titleText = document.getElementById('edit-modal-title-text');
    const badge = document.getElementById('edit-modal-badge');
    const habitInfo = document.getElementById('edit-habit-loop-info');
    const habitDetails = document.getElementById('edit-habit-loop-details');
    const deleteBtn = document.getElementById('btn-delete-event');

    this._setInputValue('edit-ev-id', item.id || '');
    this._setInputValue('edit-ev-type', item.type || 'event');
    this._setInputValue('edit-ev-title', item.title || '');
    this._setInputValue('edit-ev-date', dateObj?.dateKey || '2026-08-28');
    this._setInputValue('edit-ev-start', item.startTime || '09:00');
    this._setInputValue('edit-ev-end', item.endTime || '10:00');

    if (item.type === 'habit') {
      const h = item.data || {};
      if (titleText) titleText.textContent = 'Habit Routine Details';
      if (badge) { badge.textContent = 'Healthy Routine'; badge.className = 'badge badge-emerald'; }
      if (habitInfo) habitInfo.style.display = 'block';
      if (habitDetails) {
        habitDetails.textContent = '';
        habitDetails.appendChild(this._createRow('Trigger Cue: ', h.cue_trigger || 'Specified cue'));
        habitDetails.appendChild(this._createRow('Replaces: ', h.bad_habit || 'Unwanted habit'));
        habitDetails.appendChild(this._createRow('Reward: ', h.reward || '10 Habit Coins'));
      }
      this._setInputValue('edit-ev-desc', `Avoids: ${h.bad_habit || 'Trigger'}`);
      this._setInputValue('edit-ev-loc', h.category || 'Health & Wellness');
      this._setInputValue('edit-ev-tag', 'Health');
      if (deleteBtn) deleteBtn.textContent = 'Delete Habit';
    } else {
      const ev = item.data || {};
      if (titleText) titleText.textContent = 'Event Details';
      if (badge) { badge.textContent = ev.isGoogleEvent ? 'Google Calendar' : 'Custom Event'; badge.className = ev.isGoogleEvent ? 'badge badge-google-active' : 'badge badge-blue'; }
      if (habitInfo) habitInfo.style.display = 'none';
      this._setInputValue('edit-ev-desc', ev.description || '');
      this._setInputValue('edit-ev-loc', ev.location || '');
      this._setInputValue('edit-ev-tag', ev.tag || 'Work');
      if (deleteBtn) deleteBtn.textContent = 'Delete Event';
    }

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('open');
    this.activeItem = null;
  }

  _setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  _createRow(label, val) {
    const div = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = label;
    div.appendChild(strong);
    div.appendChild(document.createTextNode(val));
    return div;
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
      if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this.close(); });

      if (btnSave) {
        btnSave.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = document.getElementById('edit-ev-id')?.value;
          const type = document.getElementById('edit-ev-type')?.value;
          const title = (document.getElementById('edit-ev-title')?.value || '').trim();
          if (!title) {
            if (window.Toast) window.Toast.show('Please enter a title', 'error');
            return;
          }
          try {
            if (type === 'habit') {
              if (window.API?.updateHabit) await window.API.updateHabit(id, { replacement_habit: title });
            } else {
              if (window.API?.updateCalendarEvent) {
                await window.API.updateCalendarEvent(id, {
                  title,
                  description: document.getElementById('edit-ev-desc')?.value || '',
                  date: document.getElementById('edit-ev-date')?.value || '2026-08-28',
                  startTime: document.getElementById('edit-ev-start')?.value || '09:00',
                  endTime: document.getElementById('edit-ev-end')?.value || '10:00',
                  location: document.getElementById('edit-ev-loc')?.value || '',
                  tag: document.getElementById('edit-ev-tag')?.value || 'Work'
                });
              }
            }
            this.close();
            if (this.callbacks.onEventUpdated) this.callbacks.onEventUpdated({ id, type, title });
            if (window.Toast) window.Toast.show(`Updated "${title}" successfully`, 'success');
          } catch (err) {
            if (window.Toast) window.Toast.show('Failed to save changes', 'error');
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
            if (type === 'habit' && window.API?.deleteHabit) await window.API.deleteHabit(id);
            else if (window.API?.deleteCalendarEvent) await window.API.deleteCalendarEvent(id);
            this.close();
            if (this.callbacks.onEventDeleted) this.callbacks.onEventDeleted({ id, type, title });
            if (window.Toast) window.Toast.show(`Deleted "${title}"`, 'info');
          } catch (err) {
            if (window.Toast) window.Toast.show('Failed to delete item', 'error');
          }
        });
      }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  }
}

window.EventDetailModalComponent = EventDetailModalComponent;
