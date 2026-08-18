/**
 * ToastComponent — UI Component for system notifications and feedback toasts.
 * Single Responsibility: Construct and animate toast notification elements using DOM APIs.
 */
class ToastComponent extends UIComponent {
  constructor() {
    super();
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = this.createElement('div', {
        id: 'toast-container',
        className: 'toast-container'
      });
      document.body.appendChild(this.container);
    }
  }

  /**
   * Display a toast notification.
   * @param {string} message - Notification text
   * @param {'info'|'success'|'error'|'warning'} [type='info']
   * @param {number} [duration=3500]
   */
  show(message, type = 'info', duration = 3500) {
    this._ensureContainer();

    let iconName = 'sparkles';
    if (type === 'success') iconName = 'check';
    if (type === 'error') iconName = 'trash';
    if (type === 'warning') iconName = 'snowflake';

    const iconSpan = this.createElement('span', {
      className: 'toast-icon',
      attrs: { 'data-icon': iconName, 'data-size': '18' }
    });

    const msgSpan = this.createElement('span', {
      className: 'toast-msg',
      text: message
    });

    const contentDiv = this.createElement('div', {
      className: 'toast-content',
      children: [iconSpan, msgSpan]
    });

    const closeBtn = this.createElement('button', {
      className: 'toast-close',
      text: '×',
      attrs: { 'aria-label': 'Close' },
      events: {
        click: (e) => {
          const item = e.currentTarget.closest('.toast-item');
          if (item) item.remove();
        }
      }
    });

    const toastItem = this.createElement('div', {
      className: ['toast-item', `toast-${type}`],
      children: [contentDiv, closeBtn]
    });

    this.container.appendChild(toastItem);
    if (window.Icons) window.Icons.renderAll();

    setTimeout(() => {
      toastItem.classList.add('toast-fadeout');
      setTimeout(() => toastItem.remove(), 400);
    }, duration);
  }
}

window.ToastComponent = ToastComponent;
window.Toast = new ToastComponent();
