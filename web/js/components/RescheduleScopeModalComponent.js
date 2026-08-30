/**
 * RescheduleScopeModalComponent — 3-Point Recurring Reschedule Scope Selection Modal.
 * Single Responsibility: Present choices for rescheduling scope ('single', 'future', 'all')
 * and delegate the chosen scope to the reschedule handler.
 */
class RescheduleScopeModalComponent extends UIComponent {
  /**
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onScopeSelected]
   */
  constructor(callbacks = {}) {
    super();
    this.callbacks = callbacks;
    this.modalId = 'calendar-reschedule-scope-modal';
    this.pendingContext = null;
    this._initEvents();
  }

  /**
   * Open the scope modal.
   * @param {Object} item - dragged card item
   * @param {string} targetDateKey
   * @param {number} targetHour
   * @param {number} targetMinute
   */
  open(item, targetDateKey, targetHour, targetMinute = 0) {
    if (!item) return;

    this.pendingContext = {
      item,
      targetDateKey,
      targetHour,
      targetMinute
    };

    const modal = document.getElementById(this.modalId);
    if (!modal) {
      // Fallback
      if (this.callbacks.onScopeSelected) {
        this.callbacks.onScopeSelected('single', this.pendingContext);
      }
      return;
    }

    const newStartTime = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;
    const helpText = document.getElementById('scope-modal-help-text');
    if (helpText) {
      helpText.textContent = '';
      helpText.appendChild(document.createTextNode('You are moving '));
      const titleStrong = document.createElement('strong');
      titleStrong.textContent = `"${item.title}"`;
      helpText.appendChild(titleStrong);
      helpText.appendChild(document.createTextNode(` to `));
      const timeStrong = document.createElement('strong');
      timeStrong.textContent = newStartTime;
      helpText.appendChild(timeStrong);
      helpText.appendChild(document.createTextNode(` on `));
      const dateStrong = document.createElement('strong');
      dateStrong.textContent = targetDateKey;
      helpText.appendChild(dateStrong);
      helpText.appendChild(document.createTextNode('. Which occurrences would you like to update?'));
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
    this.pendingContext = null;
  }

  _initEvents() {
    const bind = () => {
      const modal = document.getElementById(this.modalId);
      const closeX = document.getElementById('scope-modal-close-x');
      const btnCancel = document.getElementById('btn-scope-cancel');
      const btnSingle = document.getElementById('btn-scope-single');
      const btnFuture = document.getElementById('btn-scope-future');
      const btnAll = document.getElementById('btn-scope-all');

      if (closeX) closeX.addEventListener('click', () => this.close());
      if (btnCancel) btnCancel.addEventListener('click', () => this.close());

      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.close();
        });
      }

      if (btnSingle) {
        btnSingle.addEventListener('click', () => {
          const ctx = this.pendingContext;
          this.close();
          if (this.callbacks.onScopeSelected && ctx) {
            this.callbacks.onScopeSelected('single', ctx);
          }
        });
      }

      if (btnFuture) {
        btnFuture.addEventListener('click', () => {
          const ctx = this.pendingContext;
          this.close();
          if (this.callbacks.onScopeSelected && ctx) {
            this.callbacks.onScopeSelected('future', ctx);
          }
        });
      }

      if (btnAll) {
        btnAll.addEventListener('click', () => {
          const ctx = this.pendingContext;
          this.close();
          if (this.callbacks.onScopeSelected && ctx) {
            this.callbacks.onScopeSelected('all', ctx);
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

window.RescheduleScopeModalComponent = RescheduleScopeModalComponent;
