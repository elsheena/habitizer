/**
 * CalendarDragDropController — Drag and Drop Snapping & Scope Invocation Controller.
 * Single Responsibility: Manage 15-minute slot dragover hover metrics, calculate snap time offsets,
 * and dispatch drop actions to the 3-point scope modal or direct reschedule handler.
 */
class CalendarDragDropController {
  constructor() {
    this._draggedItem = null;
  }

  setDraggedItem(item) {
    this._draggedItem = item;
  }

  getDraggedItem() {
    return this._draggedItem;
  }

  clearDraggedItem() {
    this._draggedItem = null;
  }

  /**
   * Handle dragover on hourly slot with 15-minute granularity calculation.
   * @param {DragEvent} e
   * @param {HTMLElement} bgSlot
   * @param {number} hour
   */
  handleDragOver(e, bgSlot, hour) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = bgSlot.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const pct = Math.max(0, Math.min(0.99, offsetY / rect.height));
    const minuteOffset = Math.min(45, Math.floor((pct * 60) / 15) * 15);
    const snapTime = `${String(hour).padStart(2, '0')}:${String(minuteOffset).padStart(2, '0')}`;
    bgSlot.classList.add('slot-drag-hover');
    bgSlot.setAttribute('data-drag-snap', snapTime);
  }

  /**
   * Handle dragleave.
   * @param {HTMLElement} bgSlot
   */
  handleDragLeave(bgSlot) {
    bgSlot.classList.remove('slot-drag-hover');
    bgSlot.removeAttribute('data-drag-snap');
  }

  /**
   * Handle drop event on slot.
   * @param {DragEvent} e
   * @param {HTMLElement} bgSlot
   * @param {Object} dateObj
   * @param {number} hour
   * @param {RescheduleScopeModalComponent} scopeModal
   * @param {Function} onDirectReschedule
   */
  handleDrop(e, bgSlot, dateObj, hour, scopeModal, onDirectReschedule) {
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
    let isRecurring = false;
    if (dragged.type === 'habit') {
      isRecurring = true;
    } else if (dragged.type === 'event') {
      const r = (dragged.data?.repeat || '').toLowerCase();
      if (r === 'daily' || r === 'weekly' || r === 'weekdays') {
        isRecurring = true;
      }
    }

    if (isRecurring && scopeModal) {
      scopeModal.open(dragged, dateObj.dateKey, hour, minuteOffset);
    } else if (onDirectReschedule) {
      onDirectReschedule('single', {
        item: dragged,
        targetDateKey: dateObj.dateKey,
        targetHour: hour,
        targetMinute: minuteOffset
      });
    }
  }
}

window.CalendarDragDropController = CalendarDragDropController;
