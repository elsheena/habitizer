/**
 * HabitCardComponent — UI Component for active habit substitution loop cards.
 * Single Responsibility: Build habit card DOM tree with cue, substitute, reward mappings and action handlers.
 */
class HabitCardComponent extends UIComponent {
  /**
   * @param {Object} habit - Habit entity
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onDelete] - Called when delete is confirmed
   */
  constructor(habit, callbacks = {}) {
    super();
    this.habit = habit;
    this.callbacks = callbacks;
    this.element = this._build();
  }

  _build() {
    const h = this.habit;

    // Header: Category tag and schedule badge
    const catTag = this.createElement('span', {
      className: 'habit-category-tag',
      text: h.category || 'General'
    });

    const clockIcon = this.createElement('span', {
      attrs: { 'data-icon': 'clock', 'data-size': '12' }
    });
    const schedText = document.createTextNode(` ${h.scheduled_time || '09:00'} (${h.frequency || 'daily'})`);
    const schedBadge = this.createElement('span', {
      className: ['badge', 'badge-gray'],
      children: [clockIcon, schedText]
    });

    const cardHeader = this.createElement('div', {
      className: 'habit-card-header',
      children: [catTag, schedBadge]
    });

    // Title: Bad habit
    const cardTitle = this.createElement('div', {
      className: 'habit-card-title',
      text: h.bad_habit
    });

    // 3-Step Substitution Loop Mapping
    const cueRow = this.createElement('div', {
      className: 'mapping-row',
      children: [
        this.createElement('span', { className: 'mapping-key', text: '1. CUE:' }),
        this.createElement('span', { className: 'mapping-val', text: h.cue_trigger })
      ]
    });

    const substituteRow = this.createElement('div', {
      className: ['mapping-row', 'mapping-substitute-highlight'],
      children: [
        this.createElement('span', { className: 'mapping-key', text: '2. SUBSTITUTE:' }),
        this.createElement('span', { className: 'mapping-val', text: h.replacement_habit || '5-Minute Deep Breathing' })
      ]
    });

    const rewardRow = this.createElement('div', {
      className: ['mapping-row', 'mapping-reward-highlight'],
      children: [
        this.createElement('span', { className: 'mapping-key', text: '3. REWARD:' }),
        this.createElement('span', { className: 'mapping-val', text: h.reward || '10 Habit Coins' })
      ]
    });

    const mappingContainer = this.createElement('div', {
      className: 'habit-loop-mapping',
      children: [cueRow, substituteRow, rewardRow]
    });

    // Action buttons (View Log + Delete)
    const calIcon = this.createElement('span', { attrs: { 'data-icon': 'calendar', 'data-size': '14' } });
    const viewLogBtn = this.createElement('a', {
      className: ['btn', 'btn-secondary', 'btn-sm'],
      attrs: { href: '/calendar' },
      children: [calIcon, document.createTextNode(' View Log')]
    });

    const trashIcon = this.createElement('span', { attrs: { 'data-icon': 'trash', 'data-size': '14' } });
    const deleteBtn = this.createElement('button', {
      className: ['btn', 'btn-danger', 'btn-sm', 'btn-delete-habit'],
      attrs: { 'data-id': h.id, title: 'Delete Habit', 'aria-label': 'Delete Habit' },
      children: [trashIcon],
      events: {
        click: async () => {
          if (confirm('Delete this habit substitution loop?')) {
            if (this.callbacks.onDelete) {
              await this.callbacks.onDelete(h.id);
            } else if (window.API) {
              await window.API.deleteHabit(h.id);
              if (window.Toast) window.Toast.show('Habit loop removed', 'info');
              this.destroy();
            }
          }
        }
      }
    });

    const cardActions = this.createElement('div', {
      className: 'habit-card-actions',
      children: [viewLogBtn, deleteBtn]
    });

    return this.createElement('div', {
      id: `card-${h.id}`,
      className: 'habit-card',
      children: [cardHeader, cardTitle, mappingContainer, cardActions]
    });
  }
}

window.HabitCardComponent = HabitCardComponent;
