/**
 * Habitizer Global App Engine & Toast Notifications
 */

const Toast = {
  container: null,

  init: function() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show: function(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconName = 'sparkles';
    if (type === 'success') iconName = 'check';
    if (type === 'error') iconName = 'trash';
    if (type === 'warning') iconName = 'snowflake';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon" data-icon="${iconName}" data-size="18"></span>
        <span class="toast-msg">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    this.container.appendChild(toast);
    if (window.Icons) window.Icons.renderAll();

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
};

window.Toast = Toast;

document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
});
