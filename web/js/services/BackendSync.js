/**
 * BackendSync — Fire-and-forget HTTP sync to Go microservices.
 * Single Responsibility: Push state changes to backend without blocking the UI.
 */
class BackendSync {
  /**
   * @param {string} [baseUrl] — API base URL. Auto-detected if omitted.
   */
  constructor(baseUrl) {
    this._baseUrl = baseUrl || (window.location.origin.includes(':8000') ? '' : 'http://localhost:8000');
  }

  /**
   * Notify backend of a login event.
   * @param {string} email
   * @param {string} password
   */
  syncLogin(email, password) {
    this._post('/api/v1/auth/login', { email, password });
  }

  /**
   * Notify backend of a registration event.
   * @param {Object} data — { full_name, email, password }
   */
  syncRegister(data) {
    this._post('/api/v1/auth/register', data);
  }

  /**
   * Sync a newly created habit to the backend.
   * @param {Object} habit
   * @param {string} userId
   */
  syncHabitCreate(habit, userId) {
    this._post('/api/v1/habits', { ...habit, user_id: userId });
  }

  /**
   * Notify backend of a habit deletion.
   * @param {string} habitId
   */
  syncHabitDelete(habitId) {
    this._delete(`/api/v1/habits?id=${habitId}`);
  }

  /**
   * Fire-and-forget POST request.
   * @param {string} path
   * @param {Object} body
   * @private
   */
  _post(path, body) {
    try {
      fetch(`${this._baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).catch(() => {});
    } catch {
      // Silently ignore — backend sync is optional
    }
  }

  /**
   * Fire-and-forget DELETE request.
   * @param {string} path
   * @private
   */
  _delete(path) {
    try {
      fetch(`${this._baseUrl}${path}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // Silently ignore
    }
  }
}

window.BackendSync = BackendSync;
