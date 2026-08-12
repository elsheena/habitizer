/**
 * ThemeManager — Dark/Light mode toggle.
 * Single Responsibility: Persist and apply the user's theme preference.
 */
class ThemeManager {
  /** @type {string} */
  static STORAGE_KEY = 'habitizer_theme';
  /** @type {string} */
  static DEFAULT_THEME = 'dark';

  constructor() {
    this._apply(this.current());
  }

  /**
   * Get the current theme name.
   * @returns {string} 'dark' or 'light'
   */
  current() {
    return localStorage.getItem(ThemeManager.STORAGE_KEY) || ThemeManager.DEFAULT_THEME;
  }

  /**
   * Toggle between dark and light themes.
   * @returns {string} the new theme name
   */
  toggle() {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(ThemeManager.STORAGE_KEY, next);
    this._apply(next);
    return next;
  }

  /**
   * Apply the theme to the document root element.
   * @param {string} theme
   * @private
   */
  _apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

window.ThemeManager = ThemeManager;
