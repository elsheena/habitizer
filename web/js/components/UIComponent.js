/**
 * UIComponent — Base class for all DOM-based UI components.
 * Single Responsibility: Provide DOM element creation, attribute binding,
 * event attachment, and mounting utilities without raw HTML string templates.
 */
class UIComponent {
  constructor() {
    /** @type {HTMLElement|null} */
    this.element = null;
  }

  /**
   * Helper to create a typed DOM element with classes, attributes, and styles.
   * @param {string} tag - HTML tag name
   * @param {Object} [options]
   * @param {string|string[]} [options.className]
   * @param {string} [options.id]
   * @param {string} [options.text]
   * @param {Object} [options.attrs]
   * @param {Object} [options.events]
   * @param {HTMLElement[]} [options.children]
   * @returns {HTMLElement}
   */
  createElement(tag, options = {}) {
    const el = document.createElement(tag);

    if (options.className) {
      if (Array.isArray(options.className)) {
        el.classList.add(...options.className.filter(Boolean));
      } else {
        el.className = options.className;
      }
    }

    if (options.id) {
      el.id = options.id;
    }

    if (options.text !== undefined && options.text !== null) {
      el.textContent = options.text;
    }

    if (options.attrs) {
      for (const [key, val] of Object.entries(options.attrs)) {
        if (val !== null && val !== undefined) {
          el.setAttribute(key, String(val));
        }
      }
    }

    if (options.events) {
      for (const [evt, handler] of Object.entries(options.events)) {
        if (typeof handler === 'function') {
          el.addEventListener(evt, handler);
        }
      }
    }

    if (options.children && Array.isArray(options.children)) {
      for (const child of options.children) {
        if (child instanceof HTMLElement) {
          el.appendChild(child);
        }
      }
    }

    return el;
  }

  /**
   * Mount this component into a container element.
   * @param {HTMLElement|string} target - Container element or selector
   */
  mount(target) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (container && this.element) {
      container.appendChild(this.element);
      this.onMounted();
    }
  }

  /**
   * Lifecycle hook called after mounting.
   */
  onMounted() {
    if (window.Icons && typeof window.Icons.renderAll === 'function') {
      window.Icons.renderAll();
    }
  }

  /**
   * Remove the element from the DOM and clean up listeners.
   */
  destroy() {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}

window.UIComponent = UIComponent;
