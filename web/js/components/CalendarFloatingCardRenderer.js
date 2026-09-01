/**
 * CalendarFloatingCardRenderer — Floating Event and Habit Card Layout & Element Builder.
 * Single Responsibility: Calculate multi-column collision layout, compute vertical top/height offsets,
 * and construct floating DOM cards with drag handles and action listeners.
 */
class CalendarFloatingCardRenderer extends UIComponent {
  /**
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onEventClicked]
   * @param {Function} [callbacks.onHabitClicked]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
  }

  renderCards(items, hourRowHeight, dragController) {
    if (!items || items.length === 0) return [];
    const elements = [];

    // Collision Column Layout Assignment
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));
    const columns = [];

    sorted.forEach(item => {
      let placedCol = -1;
      for (let c = 0; c < columns.length; c++) {
        const lastItem = columns[c][columns[c].length - 1];
        if (item.startMin >= lastItem.endMin) {
          columns[c].push(item);
          placedCol = c;
          break;
        }
      }
      if (placedCol === -1) {
        columns.push([item]);
        placedCol = columns.length - 1;
      }
      item._col = placedCol;
    });

    sorted.forEach(item => {
      let overlappingMaxCol = 0;
      sorted.forEach(other => {
        if (item !== other && Math.max(item.startMin, other.startMin) < Math.min(item.endMin, other.endMin)) {
          overlappingMaxCol = Math.max(overlappingMaxCol, other._col);
        }
      });
      item._totalCols = Math.max(overlappingMaxCol + 1, item._col + 1);
    });

    // Build DOM elements for each card
    sorted.forEach(item => {
      const topPx = (item.startMin / 60) * hourRowHeight;
      const heightPx = Math.max(26, ((item.endMin - item.startMin) / 60) * hourRowHeight - 3);
      const widthPct = 100 / item._totalCols;
      const leftPct = item._col * widthPct;

      const sTimeStr = CalendarService.minutesToTime(item.startMin);
      const eTimeStr = CalendarService.minutesToTime(item.endMin);

      const timeSpan = this.createElement('span', { className: 'floating-card-time', text: `${sTimeStr} - ${eTimeStr}` });
      const titleSpan = this.createElement('span', { className: 'floating-card-title', text: item.title });

      const cardChildren = [timeSpan, titleSpan];
      if (heightPx > 42 && item.sub) {
        cardChildren.push(this.createElement('span', { className: 'floating-card-sub', text: item.sub }));
      }

      const isHabit = item.type === 'habit';
      const isGoogle = item.data?.isGoogleEvent;
      const cardTypeClass = isHabit ? 'card-habit-type' : (isGoogle ? 'card-google-type' : 'card-custom-type');

      const cardEl = this.createElement('div', {
        className: ['floating-event-card', cardTypeClass],
        attrs: {
          style: `top: ${topPx}px; height: ${heightPx}px; left: ${leftPct}%; width: ${widthPct}%;`,
          draggable: 'true',
          title: `Drag to reschedule ${item.title}`
        },
        children: cardChildren,
        events: {
          click: (e) => {
            e.stopPropagation();
            if (isHabit && this.callbacks.onHabitClicked) {
              this.callbacks.onHabitClicked(item);
            } else if (!isHabit && this.callbacks.onEventClicked) {
              this.callbacks.onEventClicked(item.data);
            }
          },
          dragstart: (e) => {
            if (dragController) dragController.setDraggedItem(item);
            e.dataTransfer.setData('text/plain', item.id);
            e.dataTransfer.effectAllowed = 'move';
            cardEl.classList.add('is-dragging');
          },
          dragend: () => {
            cardEl.classList.remove('is-dragging');
            if (dragController) dragController.clearDraggedItem();
          }
        }
      });

      elements.push(cardEl);
    });

    return elements;
  }
}

window.CalendarFloatingCardRenderer = CalendarFloatingCardRenderer;
