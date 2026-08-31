/**
 * SlotCreationModalComponent — 2-Step Time Slot Creation Modal.
 * Single Responsibility: Present choice between adding a Habit vs a Calendar Event on slot click,
 * and manage custom event creation form submission (including recurrence configuration).
 */
class SlotCreationModalComponent extends UIComponent {
  /**
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onEventCreated]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
    this.modalId = 'calendar-slot-create-modal';
    this.activeContext = null;
    this._bound = false;
    this._initEvents();
  }

  /**
   * Open modal for a specific date and time slot.
   * @param {Object} dateObj
   * @param {string} timeStr
   */
  open(dateObj, timeStr) {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;

    this.activeContext = {
      dateKey: (dateObj && dateObj.dateKey) ? dateObj.dateKey : '2026-08-28',
      dow: (dateObj && dateObj.dow) ? dateObj.dow : 'Fri',
      dayNum: (dateObj && dateObj.dayNum) ? dateObj.dayNum : '28',
      timeStr: timeStr || '09:00'
    };

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
      timeLabel.textContent = `Selected time slot: ${this.activeContext.dow}, Aug ${this.activeContext.dayNum} at ${this.activeContext.timeStr}`;
    }

    const startHour = parseInt(this.activeContext.timeStr.split(':')[0], 10) || 9;
    const endHour = Math.min(24, startHour + 1);
    const endTimeStr = endHour === 24 ? '23:59' : `${String(endHour).padStart(2, '0')}:00`;

    const inputDate = document.getElementById('slot-ev-date');
    const inputStart = document.getElementById('slot-ev-start');
    const inputEnd = document.getElementById('slot-ev-end');
    const inputTitle = document.getElementById('slot-ev-title');
    const inputDesc = document.getElementById('slot-ev-desc');
    const inputLoc = document.getElementById('slot-ev-loc');
    const inputRepeat = document.getElementById('slot-ev-repeat');

    if (inputDate) inputDate.value = this.activeContext.dateKey;
    if (inputStart) inputStart.value = this.activeContext.timeStr;
    if (inputEnd) inputEnd.value = endTimeStr;
    if (inputTitle) inputTitle.value = '';
    if (inputDesc) inputDesc.value = '';
    if (inputLoc) inputLoc.value = '';
    if (inputRepeat) inputRepeat.value = 'none';

    modal.classList.add('open');
    if (window.Icons) window.Icons.renderAll();
  }

  /**
   * Close the modal.
   */
  close() {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.classList.remove('open');
    this.activeContext = null;
  }

  _initEvents() {
    if (this._bound) return;

    const bind = () => {
      if (this._bound) return;
      const modal = document.getElementById(this.modalId);
      if (!modal) return;
      this._bound = true;

      const closeX = document.getElementById('slot-modal-close-x');
      const btnCancel = document.getElementById('slot-modal-btn-cancel');
      const btnBack = document.getElementById('slot-modal-btn-back');
      const btnChoiceHabit = document.getElementById('btn-choice-habit');
      const btnChoiceEvent = document.getElementById('btn-choice-event');
      const btnSubmit = document.getElementById('slot-modal-btn-submit');
      const stepChoice = document.getElementById('slot-modal-step-choice');
      const stepForm = document.getElementById('slot-modal-step-form');

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });

      if (closeX) closeX.addEventListener('click', () => this.close());
      if (btnCancel) btnCancel.addEventListener('click', () => this.close());

      if (btnChoiceHabit) {
        btnChoiceHabit.addEventListener('click', () => {
          this.close();
          const targetTime = this.activeContext ? this.activeContext.timeStr : '09:00';
          window.location.href = `/create?time=${encodeURIComponent(targetTime)}`;
        });
      }

      if (btnChoiceEvent) {
        btnChoiceEvent.addEventListener('click', () => {
          if (stepChoice) stepChoice.style.display = 'none';
          if (stepForm) stepForm.style.display = 'block';
          if (btnBack) btnBack.style.display = 'inline-flex';
          if (btnSubmit) btnSubmit.style.display = 'inline-flex';
        });
      }

      if (btnBack) {
        btnBack.addEventListener('click', () => {
          if (stepChoice) stepChoice.style.display = 'block';
          if (stepForm) stepForm.style.display = 'none';
          if (btnBack) btnBack.style.display = 'none';
          if (btnSubmit) btnSubmit.style.display = 'none';
        });
      }

      if (btnSubmit) {
        btnSubmit.addEventListener('click', async (e) => {
          e.preventDefault();
          const title = (document.getElementById('slot-ev-title')?.value || '').trim();
          const desc = (document.getElementById('slot-ev-desc')?.value || '').trim();
          const date = document.getElementById('slot-ev-date')?.value || (this.activeContext ? this.activeContext.dateKey : '2026-08-28');
          const start = document.getElementById('slot-ev-start')?.value || '09:00';
          const end = document.getElementById('slot-ev-end')?.value || '10:00';
          const loc = (document.getElementById('slot-ev-loc')?.value || '').trim();
          const tag = document.getElementById('slot-ev-tag')?.value || 'General';
          const repeat = document.getElementById('slot-ev-repeat')?.value || 'none';

          if (!title) {
            if (window.Toast) window.Toast.show('Please enter an event title (* required)', 'error');
            document.getElementById('slot-ev-title')?.focus();
            return;
          }

          try {
            if (window.API && window.API.addCalendarEvent) {
              const isRecurring = repeat !== 'none';
              const newEvent = await window.API.addCalendarEvent({
                title: title,
                description: desc,
                date: date,
                startTime: start,
                endTime: end,
                location: loc,
                tag: tag,
                repeat: repeat,
                isRecurring: isRecurring,
                isGoogleEvent: false
              });

              this.close();
              if (this.callbacks.onEventCreated) {
                await this.callbacks.onEventCreated(newEvent);
              }
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
      document.addEventListener('DOMContentLoaded', bind);
    } else {
      bind();
    }
  }
}

window.SlotCreationModalComponent = SlotCreationModalComponent;
