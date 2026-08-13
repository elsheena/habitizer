/**
 * AuthService — Authentication session management.
 * Single Responsibility: Login, register, logout, session queries.
 */
class AuthService {
  /** @type {string} */
  static TOKEN_KEY = 'habitizer_auth_token';
  /** @type {string} */
  static USER_KEY = 'habitizer_user';
  /** @type {string} */
  static LOGGED_IN_KEY = 'habitizer_logged_in';

  /**
   * @param {StorageService} storage
   * @param {UserRepository} userRepo
   * @param {UserStateRepository} stateRepo
   * @param {BackendSync} backendSync
   */
  constructor(storage, userRepo, stateRepo, backendSync) {
    this._storage = storage;
    this._userRepo = userRepo;
    this._stateRepo = stateRepo;
    this._backendSync = backendSync;
  }

  /**
   * Check if a user session is currently active.
   * @returns {boolean}
   */
  isAuthenticated() {
    const loggedIn = this._storage.get(AuthService.LOGGED_IN_KEY);
    const token = this._storage.get(AuthService.TOKEN_KEY);
    return loggedIn === 'true' && Boolean(token);
  }

  /**
   * Redirect to login if not authenticated.
   * @returns {boolean} true if authenticated, false if redirecting.
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${returnUrl}`;
      return false;
    }
    return true;
  }

  /**
   * Authenticate a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: Object}>}
   * @throws {Error} on invalid credentials
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const found = this._userRepo.findByEmail(cleanEmail);

    if (!found) {
      if (this._userRepo.emailExists(cleanEmail)) {
        throw new Error('Incorrect password for this account.');
      }
      throw new Error('No account found with this email address. Please register first.');
    }

    if (found.password !== password) {
      throw new Error('Incorrect password for this account.');
    }

    const token = AuthService._generateToken(found.id);
    const safeUser = AuthService._toSafeUser(found);

    this._setSession(token, safeUser);
    this._backendSync.syncLogin(cleanEmail, password);

    return { token, user: safeUser };
  }

  /**
   * Register a new user account.
   * @param {string} fullName
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user: Object}>}
   * @throws {Error} on validation failure or duplicate email
   */
  async register(fullName, email, password) {
    if (!fullName || !email || !password) {
      throw new Error('All fields (Name, Email, Password) are required.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (this._userRepo.emailExists(cleanEmail)) {
      throw new Error('An account with this email address already exists. Please sign in.');
    }

    const newUser = {
      id: UserRepository.generateId(),
      email: cleanEmail,
      password: password,
      full_name: cleanName,
      tier: 'free',
      is_mock: false
    };

    this._userRepo.create(newUser);

    const token = AuthService._generateToken(newUser.id);
    const safeUser = AuthService._toSafeUser(newUser);

    this._setSession(token, safeUser);

    // Initialize clean state for this user
    this._stateRepo.load(safeUser.id);

    this._backendSync.syncRegister({ full_name: cleanName, email: cleanEmail, password });

    return { token, user: safeUser };
  }

  /**
   * End the current session and redirect to login.
   */
  async logout() {
    this._storage.remove(AuthService.TOKEN_KEY);
    this._storage.remove(AuthService.USER_KEY);
    this._storage.set(AuthService.LOGGED_IN_KEY, 'false');
    window.location.href = '/login';
  }

  /**
   * Get the currently authenticated user's profile.
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    if (!this.isAuthenticated()) {
      return { id: '', email: '', full_name: 'Guest', tier: 'free', is_mock: false };
    }

    const saved = this._storage.getJSON(AuthService.USER_KEY, null);
    if (saved) return saved;

    return {
      id: UserRepository.MOCK_USER_ID,
      email: 'alex.doe@habitizer.io',
      full_name: 'Alex Doe',
      tier: 'free',
      is_mock: true
    };
  }

  /**
   * Toggle the user's tier between free and premium (mock feature).
   * @returns {Promise<Object>} updated user
   */
  async toggleTier() {
    const user = await this.getCurrentUser();
    user.tier = user.tier === 'free' ? 'premium' : 'free';
    this._storage.setJSON(AuthService.USER_KEY, user);
    return user;
  }

  /**
   * Store session data in localStorage.
   * @param {string} token
   * @param {Object} user
   * @private
   */
  _setSession(token, user) {
    this._storage.set(AuthService.TOKEN_KEY, token);
    this._storage.setJSON(AuthService.USER_KEY, user);
    this._storage.set(AuthService.LOGGED_IN_KEY, 'true');
  }

  /**
   * Generate a pseudo-JWT token.
   * @param {string} userId
   * @returns {string}
   * @private
   */
  static _generateToken(userId) {
    return `jwt_auth_token_${userId}_${Date.now()}`;
  }

  /**
   * Strip password from a user record for session storage.
   * @param {Object} user
   * @returns {Object}
   * @private
   */
  static _toSafeUser(user) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      tier: user.tier || 'free',
      is_mock: Boolean(user.is_mock)
    };
  }
}

window.AuthService = AuthService;
