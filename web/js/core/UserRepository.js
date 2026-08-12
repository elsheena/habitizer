/**
 * UserRepository — Manages the user accounts database.
 * Single Responsibility: CRUD for user account records.
 */
class UserRepository {
  /** @type {string} */
  static STORAGE_KEY = 'habitizer_users_db';

  /** @type {string} */
  static MOCK_USER_ID = 'usr_demo_88';

  /**
   * @param {StorageService} storage
   */
  constructor(storage) {
    this._storage = storage;
    this._ensureSeeded();
  }

  /**
   * Seed the database with the initial mock user if empty.
   * @private
   */
  _ensureSeeded() {
    const existing = this._storage.getJSON(UserRepository.STORAGE_KEY, null);
    if (!existing) {
      this._storage.setJSON(UserRepository.STORAGE_KEY, UserRepository._initialUsers());
    }
  }

  /**
   * @returns {Array<Object>} All registered user records.
   */
  getAll() {
    return this._storage.getJSON(UserRepository.STORAGE_KEY, UserRepository._initialUsers());
  }

  /**
   * Find a user by exact email match (case-insensitive).
   * @param {string} email
   * @returns {Object|null}
   */
  findByEmail(email) {
    const clean = email.trim().toLowerCase();
    return this.getAll().find(u => u.email.toLowerCase() === clean) || null;
  }

  /**
   * Check if an email is already registered.
   * @param {string} email
   * @returns {boolean}
   */
  emailExists(email) {
    return this.findByEmail(email) !== null;
  }

  /**
   * Persist a new user record.
   * @param {Object} userData — { id, email, password, full_name, tier, is_mock }
   * @returns {Object} the created user
   */
  create(userData) {
    const users = this.getAll();
    users.push(userData);
    this._storage.setJSON(UserRepository.STORAGE_KEY, users);
    return userData;
  }

  /**
   * Generate a unique user ID.
   * @returns {string}
   */
  static generateId() {
    return 'usr_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * @returns {Array<Object>} Default seed users.
   * @private
   */
  static _initialUsers() {
    return [
      {
        id: UserRepository.MOCK_USER_ID,
        email: 'alex.doe@habitizer.io',
        password: 'HabitSecure#2026',
        full_name: 'Alex Doe',
        tier: 'free',
        is_mock: true
      }
    ];
  }
}

window.UserRepository = UserRepository;
