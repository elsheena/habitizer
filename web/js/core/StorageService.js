/**
 * StorageService — Encapsulates all localStorage access.
 * Single Responsibility: Read/write persistence layer.
 */
class StorageService {
  /**
   * Get a raw string value from localStorage.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    return localStorage.getItem(key);
  }

  /**
   * Set a raw string value in localStorage.
   * @param {string} key
   * @param {string} value
   */
  set(key, value) {
    localStorage.setItem(key, value);
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  }

  /**
   * Get a parsed JSON value from localStorage.
   * Returns fallback if key is missing or JSON is malformed.
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  getJSON(key, fallback = null) {
    const raw = this.get(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  /**
   * Serialize and store a value as JSON in localStorage.
   * @param {string} key
   * @param {*} value
   */
  setJSON(key, value) {
    this.set(key, JSON.stringify(value));
  }
}

window.StorageService = StorageService;
